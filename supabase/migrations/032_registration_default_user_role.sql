-- RBAC delta: registro unificado con rol user por defecto (sin auto-refugio en signup)

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'nombre'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  if v_name is null or char_length(v_name) < 2 then
    v_name := 'Usuario';
  end if;

  insert into public.profiles (id, display_name, email, system_role)
  values (new.id, v_name, new.email, 'user')
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        display_name = coalesce(
          nullif(trim(public.profiles.display_name), ''),
          excluded.display_name
        );

  return new;
end;
$$;

-- Solo elevar a shelter al crear refugio explícitamente (p. ej. aprobación admin), no en registro genérico
create or replace function public.sync_profile_shelter_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, system_role)
  values (new.user_id, new.nombre, 'shelter')
  on conflict (id) do update
    set system_role = case
          when public.profiles.system_role = 'admin'::public.system_role
            then 'admin'::public.system_role
          else 'shelter'::public.system_role
        end,
        display_name = coalesce(
          nullif(trim(public.profiles.display_name), ''),
          excluded.display_name,
          new.nombre
        );
  return new;
end;
$$;
