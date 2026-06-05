-- Corregir INSERT en shelter_requests: no bloquear por refugio legacy (auto-creado con rol user)

drop policy if exists "shelter_requests_insert_own" on public.shelter_requests;
create policy "shelter_requests_insert_own"
  on public.shelter_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_status = 'active'
    )
    and not exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.system_role in ('shelter', 'admin')
    )
    and not exists (
      select 1
      from public.shelter_requests sr
      where sr.user_id = auth.uid()
        and sr.status = 'pending'
    )
  );

-- RPC alternativo (security definer) por si RLS en cliente sigue fallando
create or replace function public.submit_shelter_request(
  p_nombre_refugio text,
  p_direccion text,
  p_telefono text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_role public.system_role;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select system_role into v_role from public.profiles where id = v_uid;

  if v_role is null then
    insert into public.profiles (id, display_name, system_role)
    values (v_uid, 'Usuario', 'user')
    on conflict (id) do nothing;
    v_role := 'user';
  end if;

  if v_role in ('shelter', 'admin') then
    raise exception 'Tu cuenta ya tiene permisos de refugio o administrador.';
  end if;

  if exists (
    select 1 from public.shelter_requests
    where user_id = v_uid and status = 'pending'
  ) then
    raise exception 'Ya tienes una solicitud pendiente.';
  end if;

  if char_length(trim(p_nombre_refugio)) < 2 then
    raise exception 'Nombre del refugio inválido.';
  end if;
  if char_length(trim(p_direccion)) < 5 then
    raise exception 'Dirección inválida.';
  end if;
  if char_length(trim(p_telefono)) < 8 then
    raise exception 'Teléfono inválido.';
  end if;

  insert into public.shelter_requests (
    user_id, nombre_refugio, direccion, telefono, status
  )
  values (
    v_uid,
    trim(p_nombre_refugio),
    trim(p_direccion),
    trim(p_telefono),
    'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_shelter_request(text, text, text) to authenticated;
