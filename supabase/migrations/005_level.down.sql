-- Rollback for 005_level · DESTRUCTIVE for the level data: export first if it matters.
drop function public.sheet_pending(text, integer);
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

create or replace function public.register_attendee(p_event text, p jsonb) returns jsonb
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

alter table public.registrations drop column if exists level;

revoke execute on function public.register_attendee(text, jsonb) from public, anon, authenticated;
revoke execute on function public.sheet_pending(text, integer)   from public, anon, authenticated;
grant  execute on function public.register_attendee(text, jsonb) to service_role;
grant  execute on function public.sheet_pending(text, integer)   to service_role;
