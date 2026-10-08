-- 001_registrations · ADDITIVE (new table and functions on an empty database)
-- Run in the Supabase SQL editor: TEST project first, then LIVE (M5).
-- Rollback: 001_registrations.down.sql
-- See docs/PROJECT_PLAN.md §4 (Revision 2).

create table public.registrations (
  id                uuid primary key default gen_random_uuid(),
  event             text not null check (event ~ '^[a-z0-9-]{1,40}$'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- 31-char alphabet without 0/O/1/I/L: codes are read aloud and typed on phones
  code              text not null check (code ~ '^[2-9A-HJKMNP-Z]{4}$'),
  full_name         text not null check (char_length(full_name) between 2 and 80),
  gender            text not null check (gender in ('Male', 'Female')),
  institution       text not null default '' check (char_length(institution) <= 80),
  institution_other text not null default '' check (char_length(institution_other) <= 80),
  department        text not null default '' check (char_length(department) <= 80),
  phone             text not null check (phone ~ '^0[789][01][0-9]{8}$'),
  email             text not null check (email = lower(email) and char_length(email) <= 120 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  needs_transport   boolean not null default false,
  area              text not null default '' check (char_length(area) <= 60),
  address           text not null default '' check (char_length(address) <= 200),
  consent_at        timestamptz not null,
  followup_optin    boolean not null default false,
  age_confirmed     boolean not null check (age_confirmed),
  source            text not null default '' check (char_length(source) <= 40),
  email_status      text not null default 'PENDING' check (email_status in ('PENDING', 'SENT', 'FAILED', 'LOGGED')),
  email_attempts    integer not null default 0,
  emailed_at        timestamptz,
  last_resend_at    timestamptz,
  sheet_synced_at   timestamptz,
  constraint registrations_event_phone_key unique (event, phone),
  constraint registrations_event_email_key unique (event, email),
  constraint registrations_event_code_key  unique (event, code)
);

create index registrations_sheet_pending_idx on public.registrations (event, created_at) where sheet_synced_at is null;
create index registrations_email_status_idx on public.registrations (event, email_status);

-- Locked down: only the server (secret / service_role key) may touch this table.
alter table public.registrations enable row level security;
revoke all on table public.registrations from anon, authenticated;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger registrations_set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

-- One round trip per registration. Uniqueness comes from the constraints above, so
-- simultaneous submits are safe without any application lock.
create function public.register_attendee(p_event text, p jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_existing public.registrations%rowtype;
  v_resend   boolean;
  v_code     text;
  v_id       uuid;
begin
  for attempt in 1..8 loop
    select * into v_existing
      from public.registrations
     where event = p_event and (phone = p->>'phone' or email = lower(p->>'email'))
     limit 1;

    if found then
      -- At most one re-send per 10 minutes (atomic). The code goes to the server only.
      update public.registrations
         set last_resend_at = now()
       where id = v_existing.id
         and (last_resend_at is null or last_resend_at < now() - interval '10 minutes')
      returning true into v_resend;
      return jsonb_build_object(
        'status', 'duplicate', 'id', v_existing.id, 'code', v_existing.code,
        'email', v_existing.email, 'full_name', v_existing.full_name,
        'resend', coalesce(v_resend, false));
    end if;

    v_code := '';
    for i in 1..4 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * 31)::int, 1);
    end loop;

    begin
      insert into public.registrations (
        event, code, full_name, gender, institution, institution_other, department,
        phone, email, needs_transport, area, address, consent_at, followup_optin,
        age_confirmed, source, last_resend_at)
      values (
        p_event, v_code, p->>'full_name', p->>'gender', coalesce(p->>'institution', ''),
        coalesce(p->>'institution_other', ''), coalesce(p->>'department', ''),
        p->>'phone', lower(p->>'email'), coalesce((p->>'needs_transport')::boolean, false),
        coalesce(p->>'area', ''), coalesce(p->>'address', ''), now(),
        coalesce((p->>'followup_optin')::boolean, false), (p->>'age_confirmed')::boolean,
        coalesce(p->>'source', ''),
        now()) -- no re-send within 10 minutes of the first email
      returning id into v_id;
      return jsonb_build_object('status', 'created', 'id', v_id, 'code', v_code);
    exception when unique_violation then
      -- Code collision: try a new code. Phone/email race: the next pass finds the winner's row.
      continue;
    end;
  end loop;
  raise exception 'register_attendee: gave up after 8 attempts';
end $$;

create function public.set_email_status(p_id uuid, p_status text) returns void
language sql set search_path = '' as $$
  update public.registrations
     set email_status = p_status,
         email_attempts = email_attempts + 1,
         emailed_at = case when p_status = 'SENT' then now() else emailed_at end
   where id = p_id;
$$;

create function public.email_retry_batch(p_event text, p_limit integer default 10)
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

-- Rows not yet copied to the Google Sheet, shaped like the Sheet's columns.
create function public.sheet_pending(p_event text, p_limit integer default 500)
returns table (
  id uuid, created_at text, code text, full_name text, gender text, institution text,
  institution_other text, department text, phone text, email text, needs_transport text,
  area text, address text, consent_at text, followup_optin text, age_confirmed text, source text)
language sql set search_path = '' as $$
  select r.id,
         to_char(r.created_at at time zone 'Africa/Lagos', 'YYYY-MM-DD HH24:MI:SS'),
         r.code, r.full_name, r.gender, r.institution, r.institution_other, r.department,
         r.phone, r.email,
         case when r.needs_transport then 'Yes' else 'No' end,
         r.area, r.address,
         to_char(r.consent_at at time zone 'Africa/Lagos', 'YYYY-MM-DD HH24:MI:SS'),
         case when r.followup_optin then 'Yes' else 'No' end,
         case when r.age_confirmed then 'Yes' else 'No' end,
         r.source
    from public.registrations r
   where r.event = p_event and r.sheet_synced_at is null
   order by r.created_at
   limit p_limit;
$$;

create function public.sheet_mark_synced(p_ids uuid[]) returns integer
language sql set search_path = '' as $$
  with done as (
    update public.registrations set sheet_synced_at = now()
     where id = any(p_ids) and sheet_synced_at is null
    returning 1)
  select count(*)::integer from done;
$$;

-- Supabase grants EXECUTE to anon/authenticated by default; take it back.
revoke execute on function public.register_attendee(text, jsonb)      from public, anon, authenticated;
revoke execute on function public.set_email_status(uuid, text)         from public, anon, authenticated;
revoke execute on function public.email_retry_batch(text, integer)     from public, anon, authenticated;
revoke execute on function public.sheet_pending(text, integer)         from public, anon, authenticated;
revoke execute on function public.sheet_mark_synced(uuid[])            from public, anon, authenticated;
revoke execute on function public.set_updated_at()                     from public, anon, authenticated;
grant  execute on function public.register_attendee(text, jsonb)      to service_role;
grant  execute on function public.set_email_status(uuid, text)         to service_role;
grant  execute on function public.email_retry_batch(text, integer)     to service_role;
grant  execute on function public.sheet_pending(text, integer)         to service_role;
grant  execute on function public.sheet_mark_synced(uuid[])            to service_role;
