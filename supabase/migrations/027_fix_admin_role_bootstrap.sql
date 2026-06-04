-- FEAT-009 fix: permitir promover el primer admin desde SQL Editor / service role
--
-- Problema: guard_profile_system_role revertía system_role si current_user_is_admin()
-- es false; en SQL Editor auth.uid() es NULL → el UPDATE a admin no tenía efecto.

create or replace function public.guard_profile_system_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.system_role is distinct from old.system_role then
    -- SQL Editor, migraciones y service role (sin JWT de usuario)
    if auth.uid() is null then
      return new;
    end if;

    if not public.current_user_is_admin() then
      new.system_role := old.system_role;
    end if;
  end if;
  return new;
end;
$$;

-- Promover el primer administrador (o cualquier usuario vía SQL privilegiado)
create or replace function public.bootstrap_platform_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if p_user_id is null then
    raise exception 'Debes indicar el UUID del usuario.';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'No existe ese usuario en auth.users.';
  end if;

  select trim(coalesce(
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1),
    'Usuario'
  ))
  into v_name
  from auth.users u
  where u.id = p_user_id;

  if char_length(v_name) < 2 then
    v_name := 'Usuario';
  end if;

  insert into public.profiles (id, display_name, email, system_role)
  select u.id, v_name, u.email, 'user'::public.system_role
  from auth.users u
  where u.id = p_user_id
  on conflict (id) do nothing;

  update public.profiles
  set system_role = 'admin'::public.system_role
  where id = p_user_id;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.system_role = 'admin'::public.system_role
  ) then
    raise exception 'No se pudo asignar admin al usuario %.', p_user_id;
  end if;
end;
$$;

revoke all on function public.bootstrap_platform_admin(uuid) from public;
-- No exponer a la API anon/authenticated; ejecutar solo en SQL Editor (postgres)

comment on function public.bootstrap_platform_admin(uuid) is
  'FEAT-009: promover administrador desde SQL Editor. Ej: select bootstrap_platform_admin(''uuid'');';
