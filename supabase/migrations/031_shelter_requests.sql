-- RBAC delta: solicitudes de cuenta de refugio

do $$ begin
  create type public.shelter_request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.shelter_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre_refugio text not null
    check (char_length(trim(nombre_refugio)) >= 2),
  direccion text not null
    check (char_length(trim(direccion)) >= 5),
  telefono text not null
    check (char_length(trim(telefono)) >= 8),
  status public.shelter_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index if not exists shelter_requests_user_idx
  on public.shelter_requests (user_id, created_at desc);

create unique index if not exists shelter_requests_one_pending_per_user
  on public.shelter_requests (user_id)
  where status = 'pending';

comment on table public.shelter_requests is
  'Solicitudes de usuarios para operar como refugio (RBAC)';

alter table public.shelter_requests enable row level security;

drop policy if exists "shelter_requests_select_own" on public.shelter_requests;
create policy "shelter_requests_select_own"
  on public.shelter_requests for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "shelter_requests_insert_own" on public.shelter_requests;
create policy "shelter_requests_insert_own"
  on public.shelter_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and not exists (
      select 1 from public.refugios r where r.user_id = auth.uid()
    )
    and not exists (
      select 1
      from public.shelter_requests sr
      where sr.user_id = auth.uid()
        and sr.status = 'pending'
    )
  );

grant select, insert on public.shelter_requests to authenticated;

-- Aprobación por admin: crea refugio y eleva rol (invocable desde panel admin futuro)
create or replace function public.approve_shelter_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.shelter_requests%rowtype;
  v_refugio_id uuid;
  v_parts text[];
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo administradores pueden aprobar solicitudes.';
  end if;

  select * into v_req
  from public.shelter_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Solicitud no encontrada.';
  end if;

  if v_req.status <> 'pending' then
    raise exception 'La solicitud ya fue procesada.';
  end if;

  v_parts := string_to_array(trim(v_req.direccion), ',');
  if array_length(v_parts, 1) is null then
    v_parts := array[v_req.direccion];
  end if;

  insert into public.refugios (user_id, nombre, ciudad, estado)
  values (
    v_req.user_id,
    trim(v_req.nombre_refugio),
    coalesce(trim(v_parts[1]), 'Sin especificar'),
    coalesce(trim(v_parts[2]), coalesce(trim(v_parts[1]), 'Sin especificar'))
  )
  on conflict (user_id) do update
    set nombre = excluded.nombre,
        ciudad = excluded.ciudad,
        estado = excluded.estado
  returning id into v_refugio_id;

  update public.shelter_requests
  set
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = p_request_id;

  return v_refugio_id;
end;
$$;

grant execute on function public.approve_shelter_request(uuid) to authenticated;
