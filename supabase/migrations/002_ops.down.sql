-- Rollback for 002_ops · restores 001's email_retry_batch; drops ops_summary and retry_claimed_at.
drop function if exists public.ops_summary(text);

create or replace function public.email_retry_batch(p_event text, p_limit integer default 10)
returns table (id uuid, email text, full_name text, code text)
language sql set search_path = '' as $$
  select r.id, r.email, r.full_name, r.code
    from public.registrations r
   where r.event = p_event
     and r.email_attempts < 5
     and (r.email_status = 'FAILED'
          or (r.email_status = 'PENDING' and r.created_at < now() - interval '10 minutes'))
   order by r.created_at
   limit p_limit;
$$;

alter table public.registrations drop column if exists retry_claimed_at;
