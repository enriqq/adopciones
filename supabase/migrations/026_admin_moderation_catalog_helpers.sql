-- FEAT-009: alinear helpers de catálogo y alertas con moderation_status = approved

create or replace function public.refugio_has_disponible_pets(refugio_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pets p
    where p.refugio_id = refugio_uuid
      and p.estado_adopcion = 'disponible'
      and p.moderation_status = 'approved'
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_admin();
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- Notificaciones solo para mascotas disponibles y aprobadas
create or replace function public.notify_users_for_new_pet(p_pet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
  v_especie text;
  v_refugio_user_id uuid;
begin
  select p.nombre, p.especie, r.user_id
  into v_nombre, v_especie, v_refugio_user_id
  from public.pets p
  inner join public.refugios r on r.id = p.refugio_id
  where p.id = p_pet_id
    and p.estado_adopcion = 'disponible'
    and p.moderation_status = 'approved';

  if not found then
    return;
  end if;

  insert into public.notifications (user_id, message, is_read)
  select
    a.user_id,
    format(
      'Nueva mascota disponible: %s (%s) coincide con tus criterios de búsqueda.',
      v_nombre,
      v_especie
    ),
    false
  from public.search_alerts a
  where a.user_id is distinct from v_refugio_user_id
    and public.pet_matches_criteria_json(p_pet_id, a.criteria_json);
end;
$$;

create or replace function public.trg_pets_notify_search_alerts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.estado_adopcion = 'disponible'
    and NEW.moderation_status = 'approved'
    and (
      TG_OP = 'INSERT'
      or OLD.estado_adopcion is distinct from NEW.estado_adopcion
      or OLD.moderation_status is distinct from NEW.moderation_status
    )
  then
    perform public.notify_users_for_new_pet(NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists pets_notify_search_alerts on public.pets;
create trigger pets_notify_search_alerts
  after insert or update of estado_adopcion, moderation_status on public.pets
  for each row execute function public.trg_pets_notify_search_alerts();

-- display_name >= 2 en signup Auth
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := trim(coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1),
    'Usuario'
  ));
  if char_length(v_name) < 2 then
    v_name := 'Usuario';
  end if;

  insert into public.profiles (id, display_name, email, system_role)
  values (new.id, v_name, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;
