-- =====================================================================
-- The CISSP Reader — database schema (Supabase free tier)
-- Privacy-by-design: row-level security on every table, append-only
-- audit trail, data-subject rights (access, rectification, erasure,
-- consent withdrawal) for GDPR and India's DPDP Act 2023.
-- =====================================================================

-- ---------- settings (not readable by clients) ----------
create table if not exists public.app_settings (
  key   text primary key,
  value text not null default ''
);
alter table public.app_settings enable row level security;

insert into public.app_settings (key, value) values
  ('admin_username',   'adminjoin2ajkumar'),
  ('admin_email',      ''),                       -- set once the admin email is known
  ('privileged_emails','join2ajkumar@gmail.com'), -- comma separated, no spaces
  ('privacy_version',  '2026-11-v1')
on conflict (key) do nothing;

create or replace function public.setting(k text) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select value from public.app_settings where key = k), '')
$$;
revoke execute on function public.setting(text) from public, anon, authenticated;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  username          text unique check (username ~ '^[a-z0-9_.-]{3,32}$'),
  full_name         text check (char_length(full_name) <= 80),
  role              text not null default 'learner' check (role in ('learner','admin')),
  privileged        boolean not null default false,
  target_date       date,
  latest_date       date,
  exam_booked       boolean not null default false,
  weekly_hours      int check (weekly_hours between 1 and 80),
  experience_years  int check (experience_years between 0 and 60),
  self_assessment   jsonb not null default '{}'::jsonb,
  onboarded         boolean not null default false,
  consent_terms_at  timestamptz,
  consent_version   text,
  consent_analytics boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_seen_at      timestamptz
);
alter table public.profiles enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;
create or replace function public.is_privileged() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and (privileged or role = 'admin'))
$$;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_privileged() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_privileged() to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- ---------- audit trail (append-only) ----------
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid,
  actor_label text,
  subject_id  uuid,
  action      text not null,
  detail      jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_subject_idx on public.audit_log (subject_id);
alter table public.audit_log enable row level security;
create policy audit_admin_read on public.audit_log for select to authenticated
  using ((select public.is_admin()));
-- no insert / update / delete policies: clients can only write through log_event()

create or replace function public.audit_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('app.allow_audit_redaction', true), '') <> 'on' then
    raise exception 'audit_log is append-only';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function public.audit_guard();

create or replace function public.audit(p_actor uuid, p_subject uuid, p_action text, p_detail jsonb default '{}')
returns void language plpgsql security definer set search_path = '' as $$
declare lbl text;
begin
  select coalesce(username, email) into lbl from public.profiles where id = p_actor;
  insert into public.audit_log (actor_id, actor_label, subject_id, action, detail)
  values (p_actor, lbl, p_subject, p_action, coalesce(p_detail, '{}'::jsonb));
end $$;
revoke execute on function public.audit(uuid, uuid, text, jsonb) from public, anon, authenticated;

-- client events: only 'user.*' actions, small payloads
create or replace function public.log_event(p_action text, p_detail jsonb default '{}')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  if p_action !~ '^user\.[a-z_.]{2,40}$' then raise exception 'invalid action'; end if;
  if pg_column_size(p_detail) > 2000 then p_detail := '{}'::jsonb; end if;
  perform public.audit(auth.uid(), auth.uid(), p_action, p_detail);
end $$;
revoke execute on function public.log_event(text, jsonb) from public, anon;
grant execute on function public.log_event(text, jsonb) to authenticated;

-- ---------- profile guard: users cannot raise their own privileges ----------
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare changed text[];
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id; new.role := old.role; new.privileged := old.privileged;
    new.email := old.email; new.created_at := old.created_at;
  end if;
  if new.username is distinct from old.username
     and new.username = lower(public.setting('admin_username'))
     and new.email <> lower(public.setting('admin_email')) then
    raise exception 'That username is reserved';
  end if;
  new.updated_at := now();
  select array_agg(n.key) into changed
    from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o using (key)
   where n.value is distinct from o.value and n.key not in ('updated_at','last_seen_at');
  if changed is not null then
    perform public.audit(coalesce(auth.uid(), new.id), new.id, 'profile.updated', jsonb_build_object('fields', to_jsonb(changed)));
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------- new account → profile ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uname text := nullif(lower(trim(new.raw_user_meta_data->>'username')), '');
  em    text := lower(new.email);
  adm   text := lower(public.setting('admin_email'));
  is_adm boolean;
  consented boolean := coalesce(new.raw_user_meta_data->>'consent', 'false') = 'true';
begin
  if uname is not null and uname = lower(public.setting('admin_username')) and (adm = '' or em <> adm) then
    raise exception 'That username is reserved';
  end if;
  is_adm := adm <> '' and em = adm;
  insert into public.profiles (id, email, username, full_name, role, privileged, consent_terms_at, consent_version)
  values (new.id, em, uname, left(new.raw_user_meta_data->>'full_name', 80),
          case when is_adm then 'admin' else 'learner' end,
          is_adm or em = any (string_to_array(lower(public.setting('privileged_emails')), ',')),
          case when consented then now() end,
          case when consented then public.setting('privacy_version') end);
  insert into public.audit_log (actor_id, actor_label, subject_id, action, detail)
  values (new.id, coalesce(uname, em), new.id, 'account.created',
          jsonb_build_object('invited', coalesce(new.raw_user_meta_data->>'invited', 'false'), 'consent', consented));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_verified() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.audit(new.id, new.id, 'account.email_verified', '{}'::jsonb);
  end if;
  return new;
end $$;
create trigger on_auth_user_verified after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_verified();

-- ---------- login helpers (pre-auth) ----------
create or replace function public.email_for_login(p text) returns text
language sql stable security definer set search_path = '' as $$
  select email from public.profiles where username = lower(trim(p)) limit 1
$$;
create or replace function public.username_available(p text) returns boolean
language sql stable security definer set search_path = '' as $$
  select lower(trim(p)) ~ '^[a-z0-9_.-]{3,32}$'
     and lower(trim(p)) <> lower(public.setting('admin_username'))
     and not exists (select 1 from public.profiles where username = lower(trim(p)))
$$;
revoke execute on function public.email_for_login(text) from public;
revoke execute on function public.username_available(text) from public;
grant execute on function public.email_for_login(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------- learner data ----------
create table if not exists public.user_state (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.time_log (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null,
  area    text not null check (area in ('read','quiz','flashcards','mock','plan','insights','library','other')),
  domain  text not null default '',
  topic   text not null default '',
  seconds int  not null default 0 check (seconds >= 0),
  primary key (user_id, day, area, domain, topic)
);
create index if not exists time_log_day_idx on public.time_log (day);
create table if not exists public.attempts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  mode       text not null check (mode in ('quiz','mock','chapter')),
  qid        text not null,
  domain     text not null,
  topic      text,
  correct    boolean not null,
  chosen     int,
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);
create table if not exists public.mocks (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  total      int not null check (total > 0),
  correct    int not null check (correct >= 0),
  seconds    int not null default 0,
  breakdown  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mocks_user_idx on public.mocks (user_id);
create table if not exists public.cards (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  card_id  text not null,
  box      int  not null default 1 check (box between 1 and 5),
  due      date not null default current_date,
  reviews  int  not null default 0,
  primary key (user_id, card_id)
);
create table if not exists public.resources (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  kind         text not null check (kind in ('link','video','file')),
  url          text check (url is null or url ~ '^https://'),
  storage_path text,
  domain       text,
  note         text check (char_length(note) <= 1000),
  created_at   timestamptz not null default now(),
  check (kind = 'file' or url is not null)
);
create index if not exists resources_user_idx on public.resources (user_id);
create table if not exists public.dsr_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  user_label  text,
  kind        text not null check (kind in ('access','rectify','erase','restrict','withdraw_consent','grievance','other')),
  details     text check (char_length(details) <= 2000),
  status      text not null default 'open' check (status in ('open','in_progress','done','rejected')),
  resolution  text check (char_length(resolution) <= 2000),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);
create index if not exists dsr_user_idx on public.dsr_requests (user_id);
create table if not exists public.private_content (
  key  text primary key,
  body text not null
);

alter table public.user_state      enable row level security;
alter table public.time_log        enable row level security;
alter table public.attempts        enable row level security;
alter table public.mocks           enable row level security;
alter table public.cards           enable row level security;
alter table public.resources       enable row level security;
alter table public.dsr_requests    enable row level security;
alter table public.private_content enable row level security;

-- own rows, admins can read all
do $$
declare t text;
begin
  foreach t in array array['user_state','time_log','attempts','mocks','cards','resources'] loop
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;
-- uploaded files must live in the owner's folder
drop policy if exists resources_insert on public.resources;
create policy resources_insert on public.resources for insert to authenticated
  with check (user_id = (select auth.uid())
              and (storage_path is null or storage_path like ((select auth.uid())::text || '/%')));

create policy dsr_select on public.dsr_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy dsr_insert on public.dsr_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open');
create policy dsr_update on public.dsr_requests for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy private_read on public.private_content for select to authenticated
  using ((select public.is_privileged()));

-- ---------- audit triggers on learner actions ----------
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(coalesce(new, old));
begin
  perform public.audit(coalesce(auth.uid(), (r->>'user_id')::uuid), (r->>'user_id')::uuid,
    tg_table_name || '.' || lower(tg_op),
    case tg_table_name
      when 'resources'    then jsonb_build_object('title', r->>'title', 'kind', r->>'kind')
      when 'mocks'        then jsonb_build_object('total', r->'total', 'correct', r->'correct')
      when 'dsr_requests' then jsonb_build_object('kind', r->>'kind', 'status', r->>'status')
      else '{}'::jsonb end);
  return coalesce(new, old);
end $$;
create trigger resources_audit after insert or delete on public.resources for each row execute function public.audit_row();
create trigger mocks_audit after insert on public.mocks for each row execute function public.audit_row();
create trigger dsr_audit after insert or update on public.dsr_requests for each row execute function public.audit_row();

-- ---------- RPCs ----------
create or replace function public.add_time(p_day date, p_area text, p_domain text, p_topic text, p_seconds int)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  if p_seconds < 1 or p_seconds > 600 then return; end if;
  if p_day < current_date - 1 or p_day > current_date + 1 then p_day := current_date; end if;
  insert into public.time_log (user_id, day, area, domain, topic, seconds)
  values (auth.uid(), p_day, p_area, left(coalesce(p_domain, ''), 8), left(coalesce(p_topic, ''), 48), p_seconds)
  on conflict (user_id, day, area, domain, topic)
  do update set seconds = public.time_log.seconds + excluded.seconds;
end $$;
revoke execute on function public.add_time(date, text, text, text, int) from public, anon;
grant execute on function public.add_time(date, text, text, text, int) to authenticated;

create or replace function public.touch() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set last_seen_at = now() where id = auth.uid()
$$;
revoke execute on function public.touch() from public, anon;
grant execute on function public.touch() to authenticated;

create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); out jsonb;
begin
  if u is null then raise exception 'not signed in'; end if;
  select jsonb_build_object(
    'exported_at', now(),
    'profile',   (select to_jsonb(p) from public.profiles p where id = u),
    'state',     (select state from public.user_state where user_id = u),
    'time_log',  coalesce((select jsonb_agg(t) from public.time_log t where user_id = u), '[]'),
    'attempts',  coalesce((select jsonb_agg(a) from public.attempts a where user_id = u), '[]'),
    'mocks',     coalesce((select jsonb_agg(m) from public.mocks m where user_id = u), '[]'),
    'cards',     coalesce((select jsonb_agg(c) from public.cards c where user_id = u), '[]'),
    'resources', coalesce((select jsonb_agg(r) from public.resources r where user_id = u), '[]'),
    'requests',  coalesce((select jsonb_agg(d) from public.dsr_requests d where user_id = u), '[]'),
    'audit',     coalesce((select jsonb_agg(l order by l.at) from public.audit_log l where actor_id = u or subject_id = u), '[]')
  ) into out;
  perform public.audit(u, u, 'privacy.export', '{}'::jsonb);
  return out;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- erasure: pseudonymise the audit trail, then delete the account (cascades)
create or replace function public.erase_user(p uuid, p_by uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare ref text := 'erased-' || left(md5(p::text || now()::text), 10);
begin
  perform set_config('app.allow_audit_redaction', 'on', true);
  update public.audit_log set actor_label = ref, actor_id = null where actor_id = p;
  update public.audit_log set subject_id = null where subject_id = p;
  perform set_config('app.allow_audit_redaction', 'off', true);
  update public.dsr_requests set user_label = ref where user_id = p;
  delete from auth.users where id = p;
  insert into public.audit_log (actor_id, actor_label, action, detail)
  values (p_by, coalesce((select coalesce(username, email) from public.profiles where id = p_by), ref),
          'account.erased', jsonb_build_object('ref', ref, 'reason', p_reason));
end $$;
revoke execute on function public.erase_user(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  perform public.erase_user(auth.uid(), null, 'self-service erasure');
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.admin_delete_user(p uuid, p_reason text default 'admin erasure') returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p = auth.uid() then raise exception 'use delete_my_account for your own account'; end if;
  perform public.erase_user(p, auth.uid(), left(p_reason, 200));
end $$;
revoke execute on function public.admin_delete_user(uuid, text) from public, anon;
grant execute on function public.admin_delete_user(uuid, text) to authenticated;

create or replace function public.admin_users()
returns table (id uuid, email text, username text, full_name text, role text, privileged boolean,
               verified boolean, created_at timestamptz, last_seen_at timestamptz, target_date date,
               onboarded boolean, consent_analytics boolean, total_seconds bigint, seconds_7d bigint,
               sections_read int, attempts bigint, correct bigint, mocks bigint, best_mock int)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  perform public.audit(auth.uid(), null, 'admin.viewed_learners', '{}'::jsonb);
  return query
  select p.id, p.email, p.username, p.full_name, p.role, p.privileged,
         (u.email_confirmed_at is not null), p.created_at, p.last_seen_at, p.target_date,
         p.onboarded, p.consent_analytics,
         coalesce((select sum(t.seconds) from public.time_log t where t.user_id = p.id), 0)::bigint,
         coalesce((select sum(t.seconds) from public.time_log t where t.user_id = p.id and t.day > current_date - 7), 0)::bigint,
         coalesce((select count(*) from jsonb_object_keys(coalesce(s.state->'read', '{}'::jsonb))), 0)::int,
         (select count(*) from public.attempts a where a.user_id = p.id)::bigint,
         (select count(*) from public.attempts a where a.user_id = p.id and a.correct)::bigint,
         (select count(*) from public.mocks m where m.user_id = p.id)::bigint,
         (select max(round(m.correct * 100.0 / m.total))::int from public.mocks m where m.user_id = p.id)
    from public.profiles p
    left join auth.users u on u.id = p.id
    left join public.user_state s on s.user_id = p.id
   order by p.created_at desc;
end $$;
revoke execute on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- ---------- private study content (owner + admin only) ----------
insert into public.private_content (key, body) values ('ai_tutor_prompt',
'You are my CISSP tutor. I am a security manager with a strong governance and audit background, weaker in networking, cryptography and software development. I am studying against the ISC2 CISSP Exam Outline effective 15 April 2024.

Topic: [TOPIC]

1. Explain it in plain language in under 200 words, with one real-world analogy.
2. Show how the exam frames it from a manager’s point of view.
3. Give me 3 scenario questions in CISSP style (BEST / FIRST / MOST), one at a time. Wait for my answer before revealing the explanation.
4. For each wrong answer I give, name the reason (knowledge gap, misread, missed qualifier, too technical) so I can log it.')
on conflict (key) do nothing;

-- ---------- storage: private per-learner folder ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learner-files', 'learner-files', false, 20971520, array[
  'application/pdf','image/png','image/jpeg','image/webp','text/plain','text/markdown',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;

create policy learner_files_read on storage.objects for select to authenticated
  using (bucket_id = 'learner-files' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy learner_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'learner-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy learner_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'learner-files' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
