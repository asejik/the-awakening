-- 004_harden_defaults · ADDITIVE (privileges only; idempotent)
-- P04 S-05: Supabase Security Advisor flagged public.rls_auto_enable(), a SECURITY DEFINER helper
-- Supabase creates for "automatic RLS", as executable by anon/authenticated via /rest/v1/rpc.
-- Event-trigger functions run without the caller's EXECUTE privilege, so revoking doesn't affect it.
-- Also re-asserts that our tables have no anon/authenticated grants.
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

revoke all on table public.registrations from anon, authenticated;
revoke all on table public.rate_limits   from anon, authenticated;
