-- =====================================================================
-- StudyCISSP: create the admin account directly (email already verified)
-- Run AFTER setup.sql, in Supabase → SQL Editor.
--
-- 1. Replace YOUR-PASSWORD-HERE with a password of at least 10 characters.
-- 2. Run.
-- 3. Sign in at the site with join2ajkumar@gmail.com (or adminjoin2ajkumar).
-- 4. Change the password once under Profile, because the SQL Editor keeps a
--    history of queries you run.
-- =====================================================================
do $$
declare
  v_email    text := 'join2ajkumar@gmail.com';
  v_password text := 'YOUR-PASSWORD-HERE';
  v_id       uuid := gen_random_uuid();
begin
  if v_password = 'YOUR-PASSWORD-HERE' or length(v_password) < 10 then
    raise exception 'Set your own password (10+ characters) in v_password first';
  end if;
  if exists (select 1 from auth.users where lower(email) = lower(v_email)) then
    raise exception 'An account for % already exists', v_email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', 'adminjoin2ajkumar', 'consent', 'true', 'plan', 'diamond'),
    now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());

  raise notice 'Admin account created for % (username adminjoin2ajkumar)', v_email;
end $$;

-- Check it worked: you should see role = admin, onboarded = true
select email, username, role, privileged, onboarded, target_date, latest_date, plan
  from public.profiles where email = 'join2ajkumar@gmail.com';
