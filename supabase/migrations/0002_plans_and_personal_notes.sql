-- =====================================================================
-- Plans (Silver / Gold / Diamond) editable by the admin, plan fields on
-- profiles, and personal study notes visible only to privileged users.
-- =====================================================================

create table if not exists public.plans (
  id          text primary key check (id in ('silver','gold','diamond')),
  name        text not null,
  tagline     text check (char_length(tagline) <= 160),
  price       numeric(10,2) not null default 0 check (price >= 0),
  currency    text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  free_months int  not null default 12 check (free_months between 0 and 120),
  modules     jsonb not null default '[]'::jsonb,
  perks       jsonb not null default '[]'::jsonb,
  sort        int  not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
alter table public.plans enable row level security;
create policy plans_read on public.plans for select to anon, authenticated using (true);
create policy plans_admin_update on public.plans for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.plans (id, name, tagline, price, currency, free_months, modules, perks, sort) values
 ('silver',  'Silver',  'Read, understand, plan.', 0, 'INR', 12,
  '["chapters","glossary","plan","flashcards"]',
  '["All eight chapters with animations","A–Z glossary","Personal study plan from your exam date","Chapter questions with explanations","Spaced-repetition flashcards"]', 1),
 ('gold',    'Gold',    'Practise until it sticks.', 0, 'INR', 12,
  '["chapters","glossary","plan","flashcards","quiz","mock","insights"]',
  '["Everything in Silver","Quizzes by domain, topic and weak area","Timed mock exams","Insights: time spent, streaks, accuracy"]', 2),
 ('diamond', 'Diamond', 'Everything, plus your own library.', 0, 'INR', 12,
  '["chapters","glossary","plan","flashcards","quiz","mock","insights","library"]',
  '["Everything in Gold","Personal library: upload notes, PDFs and videos","Priority help from the administrator","First access to new content"]', 3)
on conflict (id) do nothing;

create or replace function public.plans_touch() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  perform public.audit(auth.uid(), null, 'admin.plan_updated',
    jsonb_build_object('plan', new.id, 'price', new.price, 'currency', new.currency, 'free_months', new.free_months));
  return new;
end $$;
create trigger plans_touch before update on public.plans for each row execute function public.plans_touch();

-- plan fields on profiles
alter table public.profiles
  add column if not exists plan text not null default 'silver' references public.plans(id),
  add column if not exists plan_started_at timestamptz not null default now(),
  add column if not exists plan_expires_at timestamptz;

-- choose the plan from sign-up metadata; start the free period
create or replace function public.profiles_plan_init() returns trigger
language plpgsql security definer set search_path = '' as $$
declare wanted text; months int;
begin
  select lower(raw_user_meta_data->>'plan') into wanted from auth.users where id = new.id;
  if wanted is null or not exists (select 1 from public.plans where id = wanted and active) then wanted := 'silver'; end if;
  select free_months into months from public.plans where id = wanted;
  new.plan := wanted;
  new.plan_started_at := now();
  new.plan_expires_at := now() + make_interval(months => coalesce(months, 12));
  return new;
end $$;
create trigger profiles_plan_init before insert on public.profiles
  for each row execute function public.profiles_plan_init();

-- extend the guard: learners cannot change their own plan or its dates
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare changed text[];
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id; new.role := old.role; new.privileged := old.privileged;
    new.email := old.email; new.created_at := old.created_at;
    new.plan := old.plan; new.plan_started_at := old.plan_started_at; new.plan_expires_at := old.plan_expires_at;
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

-- admin_users() now also returns the plan
drop function if exists public.admin_users();
create or replace function public.admin_users()
returns table (id uuid, email text, username text, full_name text, role text, privileged boolean,
               verified boolean, created_at timestamptz, last_seen_at timestamptz, target_date date,
               onboarded boolean, consent_analytics boolean, plan text, plan_expires_at timestamptz,
               total_seconds bigint, seconds_7d bigint,
               sections_read int, attempts bigint, correct bigint, mocks bigint, best_mock int)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  perform public.audit(auth.uid(), null, 'admin.viewed_learners', '{}'::jsonb);
  return query
  select p.id, p.email, p.username, p.full_name, p.role, p.privileged,
         (u.email_confirmed_at is not null), p.created_at, p.last_seen_at, p.target_date,
         p.onboarded, p.consent_analytics, p.plan, p.plan_expires_at,
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

-- personal notes for the owner's own study area (privileged users only)
insert into public.private_content (key, body) values ('personal_notes', '{
 "d1": "Risk management is your strength from management and audit work. Spend your time on ISC2’s wording, which differs in places from ISO and ISACA, so your instincts land on the answer the exam writers chose.",
 "d2": "A strength domain for you. Fast pass: confirm owner vs custodian and the sanitisation methods, then move on.",
 "d3": "One of your priority domains (weeks 3–4 of your plan, 26 Nov – 9 Dec). Security models and cryptography are concept-heavy: read slowly and build your one-page cheat sheet as you go.",
 "d4": "Your weakest area and your first two weeks (12–25 Nov). Exit criterion: draw the OSI/TCP-IP stack with protocols, PDUs and devices from memory.",
 "d5": "Medium for you: federation and protocols are where marks are lost. Build the Kerberos / SAML / OAuth / OIDC / RADIUS / TACACS+ comparison table (17–23 Dec).",
 "d6": "Your audit background makes this a natural strength. Make sure you know the code-testing vocabulary (SAST, DAST, fuzzing) as well as audit.",
 "d7": "Your 24×7 control-room experience maps directly onto this domain. Focus on evidence handling and the exact order of incident-response steps.",
 "d8": "A priority domain, at concept level only, as your plan says (10–16 Dec). Learn the lifecycle, maturity models and the common vulnerabilities with their fixes."
}') on conflict (key) do nothing;
