-- =====================================================================
-- Access log: sign-ins and daily visits with IP, approximate location
-- and device details. Precise GPS only when the learner opts in.
-- Written only by the log-access edge function (service role); learners
-- can read their own rows, admins can read all. Kept 180 days.
-- =====================================================================

alter table public.profiles add column if not exists share_precise_location boolean not null default false;

create table if not exists public.access_log (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  at            timestamptz not null default now(),
  event         text not null check (event in ('sign_in','visit')),
  ip            text check (char_length(ip) <= 64),
  city          text check (char_length(city) <= 80),
  region        text check (char_length(region) <= 80),
  country       text check (char_length(country) <= 80),
  latitude      numeric(8,5),
  longitude     numeric(8,5),
  geo_source    text check (geo_source in ('ip','gps')),
  gps_accuracy_m int,
  user_agent    text check (char_length(user_agent) <= 400),
  browser       text check (char_length(browser) <= 60),
  os            text check (char_length(os) <= 60),
  device_type   text check (device_type in ('mobile','tablet','desktop','unknown')),
  device_model  text check (char_length(device_model) <= 80),
  screen        text check (char_length(screen) <= 30),
  language      text check (char_length(language) <= 20),
  timezone      text check (char_length(timezone) <= 60)
);
create index if not exists access_log_user_at_idx on public.access_log (user_id, at desc);
create index if not exists access_log_at_idx on public.access_log (at desc);
alter table public.access_log enable row level security;
create policy access_log_select on public.access_log for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- no insert / update / delete policies: only the edge function writes

-- the data export includes the access log
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
    'access_log', coalesce((select jsonb_agg(x order by x.at) from public.access_log x where user_id = u), '[]'),
    'audit',      coalesce((select jsonb_agg(l order by l.at) from public.audit_log l where actor_id = u or subject_id = u), '[]')
  ) into out;
  perform public.audit(u, u, 'privacy.export', '{}'::jsonb);
  return out;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
