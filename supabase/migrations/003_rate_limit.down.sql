-- Rollback for 003_rate_limit · drops the limiter; restores 002's ops_summary.
drop function if exists public.rate_limit_hit(text, integer, integer);
drop table if exists public.rate_limits;

create or replace function public.ops_summary(p_event text) returns jsonb
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
