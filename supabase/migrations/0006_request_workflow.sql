-- StudyCISSP 0006: privacy (DPDP / GDPR) request workflow
-- * only a signed-in owner with a verified email can raise a request about their own account
-- * every request gets a reference, an immediate acknowledgement and a 30-day due date
-- * if the administrator hasn't replied within 4 days, an automatic reply is posted
-- * every step is kept in dsr_events (visible to the learner) and in the audit trail

alter table public.dsr_requests add column if not exists ref text;
alter table public.dsr_requests add column if not exists acknowledged_at timestamptz;
alter table public.dsr_requests add column if not exists auto_replied_at timestamptz;
alter table public.dsr_requests add column if not exists due_at timestamptz;
update public.dsr_requests set ref = 'SR-' || to_char(created_at, 'YYYY') || '-' || lpad(id::text, 5, '0') where ref is null;
update public.dsr_requests set due_at = created_at + interval '30 days' where due_at is null;

create table if not exists public.dsr_events (
  id         bigint generated always as identity primary key,
  request_id bigint not null references public.dsr_requests(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  at         timestamptz not null default now(),
  actor      text not null check (actor in ('learner', 'system', 'admin')),
  kind       text not null check (kind in ('submitted', 'acknowledged', 'auto_reply', 'status', 'reply')),
  body       text check (char_length(body) <= 2000)
);
create index if not exists dsr_events_req_idx on public.dsr_events (request_id, at);
create index if not exists dsr_events_user_idx on public.dsr_events (user_id);
alter table public.dsr_events enable row level security;
drop policy if exists dsr_events_select on public.dsr_events;
create policy dsr_events_select on public.dsr_events for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- no insert/update/delete policies: rows are written only by the functions below

create or replace function public.dsr_events_no_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- the only allowed change: pseudonymising the owner when an account is erased
  if new.user_id is null and old.user_id is not null
     and (new.request_id, new.at, new.actor, new.kind, new.body) is not distinct from (old.request_id, old.at, old.actor, old.kind, old.body) then
    return new;
  end if;
  raise exception 'request history is append-only';
end $$;
drop trigger if exists dsr_events_lock on public.dsr_events;
create trigger dsr_events_lock before update on public.dsr_events for each row execute function public.dsr_events_no_update();

-- the caller is signed in with a confirmed email address
create or replace function public.email_verified() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select email_confirmed_at is not null from auth.users where id = auth.uid()), false)
$$;
revoke execute on function public.email_verified() from public, anon;
grant execute on function public.email_verified() to authenticated;

drop policy if exists dsr_insert on public.dsr_requests;
create policy dsr_insert on public.dsr_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open' and (select public.email_verified()));

create or replace function public.dsr_kind_label(k text) returns text
language sql immutable set search_path = '' as $$
  select case k when 'access' then 'access / copy of your data' when 'rectify' then 'correction'
    when 'erase' then 'erasure' when 'restrict' then 'restriction of processing'
    when 'withdraw_consent' then 'withdrawal of consent' when 'grievance' then 'grievance'
    else 'other / nomination' end
$$;

-- before insert: reference, dates, and nothing the learner shouldn't set
create or replace function public.dsr_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.ref := 'SR-' || to_char(now(), 'YYYY') || '-' || lpad(new.id::text, 5, '0');
  new.created_at := now(); new.acknowledged_at := now(); new.due_at := now() + interval '30 days';
  new.status := 'open'; new.resolution := null; new.resolved_at := null; new.resolved_by := null; new.auto_replied_at := null;
  return new;
end $$;
drop trigger if exists dsr_before_ins on public.dsr_requests;
create trigger dsr_before_ins before insert on public.dsr_requests for each row execute function public.dsr_before_insert();

-- after insert: log the request and acknowledge it straight away
create or replace function public.dsr_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.dsr_events (request_id, user_id, actor, kind, body)
    values (new.id, new.user_id, 'learner', 'submitted', new.details);
  insert into public.dsr_events (request_id, user_id, actor, kind, body)
    values (new.id, new.user_id, 'system', 'acknowledged',
      'We have received your ' || public.dsr_kind_label(new.kind) || ' request, reference ' || new.ref || '. '
      || 'It came from your signed-in account with a verified email address, so no further identity check is needed. '
      || 'If the administrator has not replied within 4 days you will get an automatic update here. '
      || 'We will complete it by ' || to_char(new.due_at, 'DD Mon YYYY') || ' (within 30 days). Please quote ' || new.ref || ' in any follow-up.');
  perform public.audit(new.user_id, new.user_id, 'dsr.acknowledged', jsonb_build_object('ref', new.ref, 'kind', new.kind));
  return new;
end $$;
drop trigger if exists dsr_after_ins on public.dsr_requests;
create trigger dsr_after_ins after insert on public.dsr_requests for each row execute function public.dsr_after_insert();

-- before update (admin): closing dates; after update: log status changes and replies
create or replace function public.dsr_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.ref := old.ref; new.kind := old.kind;
  new.details := old.details;
  if new.user_id is not null then new.user_id := old.user_id; end if;  -- erasure may set it to null
  new.created_at := old.created_at; new.acknowledged_at := old.acknowledged_at; new.due_at := old.due_at;
  if new.status in ('done', 'rejected') and old.status not in ('done', 'rejected') then
    new.resolved_at := now(); new.resolved_by := auth.uid();
  elsif new.status not in ('done', 'rejected') then
    new.resolved_at := null; new.resolved_by := null;
  end if;
  return new;
end $$;
drop trigger if exists dsr_before_upd on public.dsr_requests;
create trigger dsr_before_upd before update on public.dsr_requests for each row execute function public.dsr_before_update();

create or replace function public.dsr_after_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.dsr_events (request_id, user_id, actor, kind, body)
      values (new.id, new.user_id, 'admin', 'status', 'Status changed to ' || replace(new.status, '_', ' ') || '.');
  end if;
  if new.resolution is distinct from old.resolution and coalesce(new.resolution, '') <> '' then
    insert into public.dsr_events (request_id, user_id, actor, kind, body)
      values (new.id, new.user_id, 'admin', 'reply', new.resolution);
  end if;
  return new;
end $$;
drop trigger if exists dsr_after_upd on public.dsr_requests;
create trigger dsr_after_upd after update of status, resolution on public.dsr_requests for each row execute function public.dsr_after_update();

-- the audit trail records inserts and admin changes only (not the auto-reply flag)
drop trigger if exists dsr_audit on public.dsr_requests;
create trigger dsr_audit after insert or update of status, resolution on public.dsr_requests for each row execute function public.audit_row();

-- automatic reply after 4 days without an administrator reply
create or replace function public.dsr_auto_reply(p_user uuid default null) returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0; extra text;
begin
  for r in
    select d.* from public.dsr_requests d
    where d.status in ('open', 'in_progress') and d.auto_replied_at is null
      and d.created_at <= now() - interval '4 days'
      and (p_user is null or d.user_id = p_user)
      and not exists (select 1 from public.dsr_events e where e.request_id = d.id and e.actor = 'admin' and e.kind = 'reply')
    for update of d skip locked
  loop
    extra := case r.kind
      when 'access' then ' You can download everything we hold about you right now with "Download my data" on the Privacy & trust page.'
      when 'erase' then ' You can also delete your account yourself at any time from the Privacy & trust page; that takes effect immediately.'
      when 'withdraw_consent' then ' You can switch off study analytics and GPS yourself on the Privacy & trust page; that takes effect immediately.'
      when 'rectify' then ' Most details can be corrected straight away on your Profile page.'
      else '' end;
    insert into public.dsr_events (request_id, user_id, actor, kind, body)
      values (r.id, r.user_id, 'system', 'auto_reply',
        'This is an automatic update on ' || r.ref || '. Your ' || public.dsr_kind_label(r.kind) || ' request is with the administrator and is being worked on. '
        || 'It will be completed by ' || to_char(r.due_at, 'DD Mon YYYY') || '.' || extra
        || ' If you are not satisfied with the outcome, you can complain to the Data Protection Board of India, or to your EU/UK supervisory authority.');
    update public.dsr_requests set auto_replied_at = now() where id = r.id;
    perform public.audit(null, r.user_id, 'dsr.auto_reply', jsonb_build_object('ref', r.ref, 'kind', r.kind));
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.dsr_auto_reply(uuid) from public, anon, authenticated;

-- signed-in callers can trigger the check for their own requests (admins for everyone),
-- so replies still appear on time if the scheduler is ever paused
create or replace function public.dsr_check_auto_replies() returns int
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return 0; end if;
  return public.dsr_auto_reply(case when public.is_admin() then null else auth.uid() end);
end $$;
revoke execute on function public.dsr_check_auto_replies() from public, anon;
grant execute on function public.dsr_check_auto_replies() to authenticated;

-- hourly schedule (pg_cron is available on the free tier)
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('dsr-auto-reply', '17 * * * *', 'select public.dsr_auto_reply()');

-- the export includes the request history
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); out jsonb;
begin
  if u is null then raise exception 'not signed in'; end if;
  select jsonb_build_object(
    'exported_at', now(),
    'profile',    (select to_jsonb(p) from public.profiles p where id = u),
    'state',      (select state from public.user_state where user_id = u),
    'time_log',   coalesce((select jsonb_agg(t) from public.time_log t where user_id = u), '[]'),
    'attempts',   coalesce((select jsonb_agg(a) from public.attempts a where user_id = u), '[]'),
    'mocks',      coalesce((select jsonb_agg(m) from public.mocks m where user_id = u), '[]'),
    'cards',      coalesce((select jsonb_agg(c) from public.cards c where user_id = u), '[]'),
    'resources',  coalesce((select jsonb_agg(r) from public.resources r where user_id = u), '[]'),
    'requests',   coalesce((select jsonb_agg(d) from public.dsr_requests d where user_id = u), '[]'),
    'request_history', coalesce((select jsonb_agg(e order by e.at) from public.dsr_events e where user_id = u), '[]'),
    'access_log', coalesce((select jsonb_agg(x order by x.at) from public.access_log x where user_id = u), '[]'),
    'audit',      coalesce((select jsonb_agg(l order by l.at) from public.audit_log l where actor_id = u or subject_id = u), '[]')
  ) into out;
  perform public.audit(u, u, 'privacy.export', '{}'::jsonb);
  return out;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- erase_user: rename the local variable so it can't be confused with dsr_requests.ref
create or replace function public.erase_user(p uuid, p_by uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_ref text := 'erased-' || left(md5(p::text || now()::text), 10);
begin
  perform set_config('app.allow_audit_redaction', 'on', true);
  update public.audit_log set actor_label = v_ref, actor_id = null where actor_id = p;
  update public.audit_log set subject_id = null where subject_id = p;
  perform set_config('app.allow_audit_redaction', 'off', true);
  update public.dsr_requests set user_label = v_ref where user_id = p;
  delete from auth.users where id = p;
  insert into public.audit_log (actor_id, actor_label, action, detail)
  values (p_by, coalesce((select coalesce(username, email) from public.profiles where id = p_by), v_ref),
          'account.erased', jsonb_build_object('ref', v_ref, 'reason', p_reason));
end $$;
revoke execute on function public.erase_user(uuid, uuid, text) from public, anon, authenticated;
