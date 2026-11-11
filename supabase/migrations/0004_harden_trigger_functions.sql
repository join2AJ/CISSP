-- Trigger functions run automatically; nobody needs to call them through the API.
revoke execute on function public.audit_row()             from public, anon, authenticated;
revoke execute on function public.handle_new_user()       from public, anon, authenticated;
revoke execute on function public.handle_user_verified()  from public, anon, authenticated;
revoke execute on function public.plans_touch()           from public, anon, authenticated;
revoke execute on function public.profiles_guard()        from public, anon, authenticated;
revoke execute on function public.profiles_owner_preset() from public, anon, authenticated;
revoke execute on function public.profiles_owner_state()  from public, anon, authenticated;
revoke execute on function public.profiles_plan_init()    from public, anon, authenticated;
revoke execute on function public.audit_guard()           from public, anon, authenticated;
