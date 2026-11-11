-- =====================================================================
-- Owner preset: the site owner's study account is set up automatically
-- at sign-up, so they skip the onboarding questions.
-- =====================================================================

insert into public.app_settings (key, value) values
  ('owner_email', 'join2ajkumar@gmail.com'),
  ('owner_preset', '{
     "target_date": "2027-02-09",
     "latest_date": "2027-02-18",
     "exam_booked": false,
     "weekly_hours": 11,
     "self_assessment": {"d1":"confident","d2":"confident","d3":"new","d4":"new","d5":"some","d6":"confident","d7":"confident","d8":"new"},
     "plan_start": "2026-11-12"
   }')
on conflict (key) do nothing;

create or replace function public.profiles_owner_preset() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pre jsonb;
begin
  if lower(new.email) <> lower(public.setting('owner_email')) then return new; end if;
  pre := public.setting('owner_preset')::jsonb;
  new.target_date     := (pre->>'target_date')::date;
  new.latest_date     := (pre->>'latest_date')::date;
  new.exam_booked     := coalesce((pre->>'exam_booked')::boolean, false);
  new.weekly_hours    := (pre->>'weekly_hours')::int;
  new.self_assessment := coalesce(pre->'self_assessment', '{}'::jsonb);
  new.onboarded       := true;
  new.privileged      := true;
  return new;
end $$;
create trigger profiles_owner_preset before insert on public.profiles
  for each row execute function public.profiles_owner_preset();

-- start the owner's plan on the agreed date
create or replace function public.profiles_owner_state() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) = lower(public.setting('owner_email')) then
    insert into public.user_state (user_id, state)
    values (new.id, jsonb_build_object('planStart', public.setting('owner_preset')::jsonb->>'plan_start'))
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;
create trigger profiles_owner_state after insert on public.profiles
  for each row execute function public.profiles_owner_state();
