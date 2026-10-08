-- 003_rate_limit · ADDITIVE (new table, new function, ops_summary gains last_hour)
-- P04 S-02: per-network attempt limit on /api/register, plus a spike count for alerts.
-- Run after 002 in the Supabase SQL editor: TEST first, then LIVE (M5).
-- Rollback: 003_rate_limit.down.sql

-- key = sha256(secret-salted client IP), computed in api/; raw IPs are never stored.
create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

-- Counts one attempt; returns true while the key is within p_max per fixed window.
create function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer) returns boolean
language plpgsql set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  -- Occasional housekeeping keeps the table tiny.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return v_hits <= p_max;
end $$;

-- Same signature as 002; adds last_hour for the spike alert.
create or replace function public.ops_summary(p_event text) returns jsonb
language sql set search_path = '' as $$
  select jsonb_build_object(
    'total',            count(*),
    'last_hour',        count(*) filter (where created_at > now() - interval '1 hour'),
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

revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.ops_summary(text)                      from public, anon, authenticated;
grant  execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant  execute on function public.ops_summary(text)                      to service_role;
