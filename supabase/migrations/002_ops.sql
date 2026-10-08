-- 002_ops · ADDITIVE (one nullable column, one replaced function, one new function)
-- P03-05: retry runs claim rows so overlapping runs can't double-send.
-- P03-01: ops_summary() feeds the Apps Script daily digest and alerts.
-- Run after 001 in the Supabase SQL editor: TEST first, then LIVE (M5).
-- Rollback: 002_ops.down.sql

alter table public.registrations add column retry_claimed_at timestamptz;

-- Same signature as 001, so existing grants are kept; re-applied below anyway.
create or replace function public.email_retry_batch(p_event text, p_limit integer default 10)
returns table (id uuid, email text, full_name text, code text)
language sql set search_path = '' as $$
  with picked as (
    select r.id
      from public.registrations r
     where r.event = p_event
       and r.email_attempts < 5
       and (r.email_status = 'FAILED'
            or (r.email_status = 'PENDING' and r.created_at < now() - interval '10 minutes'))
       and (r.retry_claimed_at is null or r.retry_claimed_at < now() - interval '5 minutes')
     order by r.created_at
     limit p_limit
     for update skip locked)
  update public.registrations r
     set retry_claimed_at = now()
    from picked
   where r.id = picked.id
  returning r.id, r.email, r.full_name, r.code;
$$;

create function public.ops_summary(p_event text) returns jsonb
language sql set search_path = '' as $$
  select jsonb_build_object(
    'total',            count(*),
    'last_24h',         count(*) filter (where created_at > now() - interval '24 hours'),
    'unsynced',         count(*) filter (where sheet_synced_at is null),
    'unsynced_oldest_minutes',
      coalesce(floor(extract(epoch from now() - min(created_at) filter (where sheet_synced_at is null)) / 60)::int, 0),
    'pending_stale',    count(*) filter (where email_status = 'PENDING' and created_at < now() - interval '10 minutes'),
    'failed',           count(*) filter (where email_status = 'FAILED' and email_attempts < 5),
    'exhausted',        count(*) filter (where email_status = 'FAILED' and email_attempts >= 5),
    'logged',           count(*) filter (where email_status = 'LOGGED'),
    'sent',             count(*) filter (where email_status = 'SENT'))
  from public.registrations
  where event = p_event;
$$;

revoke execute on function public.email_retry_batch(text, integer) from public, anon, authenticated;
revoke execute on function public.ops_summary(text)                from public, anon, authenticated;
grant  execute on function public.email_retry_batch(text, integer) to service_role;
grant  execute on function public.ops_summary(text)                to service_role;
