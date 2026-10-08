-- Rollback for 001_registrations · DESTRUCTIVE: deletes all registrations.
-- Export the table first if it holds anything you need.
drop function if exists public.sheet_mark_synced(uuid[]);
drop function if exists public.sheet_pending(text, integer);
drop function if exists public.email_retry_batch(text, integer);
drop function if exists public.set_email_status(uuid, text);
drop function if exists public.register_attendee(text, jsonb);
drop trigger if exists registrations_set_updated_at on public.registrations;
drop function if exists public.set_updated_at();
drop table if exists public.registrations;
