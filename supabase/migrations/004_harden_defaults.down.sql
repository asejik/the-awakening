-- Rollback for 004: intentionally a no-op. Re-granting public EXECUTE on a SECURITY DEFINER
-- helper would reopen the Security Advisor warning; restore it by hand only if Supabase support asks.
select 1;
