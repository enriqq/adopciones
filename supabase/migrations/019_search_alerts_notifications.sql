-- FEAT-007: alertas de búsqueda y notificaciones in-app

create table if not exists public.search_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  criteria_json jsonb not null default '{}'::jsonb
);

create index if not exists search_alerts_user_id_idx
  on public.search_alerts (user_id);

alter table public.search_alerts enable row level security;

comment on table public.search_alerts is
  'Criterios de búsqueda guardados por adoptante (FEAT-007)';

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null
    check (char_length(trim(message)) >= 5 and char_length(message) <= 500),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

comment on table public.notifications is
  'Notificaciones in-app para adoptantes (FEAT-007)';

create or replace function public.enforce_search_alerts_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  alert_count int;
begin
  select count(*) into alert_count
  from public.search_alerts
  where user_id = new.user_id;

  if alert_count >= 5 then
    raise exception 'Has alcanzado el límite de 5 alertas de búsqueda.';
  end if;

  return new;
end;
$$;

drop trigger if exists search_alerts_limit on public.search_alerts;
create trigger search_alerts_limit
  before insert on public.search_alerts
  for each row execute function public.enforce_search_alerts_limit();

create or replace function public.pet_matches_criteria_json(
  p_pet_id uuid,
  p_criteria jsonb
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pet record;
  v_especie jsonb;
  v_raza text;
  v_edad_preset text;
  v_tamano text;
  v_ciudad text;
  v_estado text;
  v_min_edad int;
  v_max_edad int;
begin
  select
    p.especie,
    p.raza,
    p.edad_anios,
    p.tamano,
    p.compatible_ninos,
    p.compatible_perros,
    p.compatible_gatos,
    p.estado_adopcion,
    r.ciudad,
    r.estado as refugio_estado
  into v_pet
  from public.pets p
  inner join public.refugios r on r.id = p.refugio_id
  where p.id = p_pet_id;

  if not found or v_pet.estado_adopcion <> 'disponible' then
    return false;
  end if;

  v_especie := coalesce(p_criteria->'especie', '[]'::jsonb);
  if jsonb_array_length(v_especie) > 0 then
    if not exists (
      select 1
      from jsonb_array_elements_text(v_especie) as elem
      where elem = v_pet.especie
    ) then
      return false;
    end if;
  end if;

  v_raza := trim(coalesce(p_criteria->>'raza', ''));
  if v_raza <> '' and v_pet.raza not ilike '%' || v_raza || '%' then
    return false;
  end if;

  v_tamano := coalesce(p_criteria->>'tamano', '');
  if v_tamano <> '' and v_pet.tamano is distinct from v_tamano then
    return false;
  end if;

  v_edad_preset := coalesce(p_criteria->>'edadPreset', '');
  v_min_edad := case v_edad_preset
    when 'cachorro' then 0
    when 'adulto' then 2
    when 'senior' then 8
    else null
  end;
  v_max_edad := case v_edad_preset
    when 'cachorro' then 1
    when 'adulto' then 7
    when 'senior' then 30
    else null
  end;

  if v_min_edad is not null and coalesce(v_pet.edad_anios, 0) < v_min_edad then
    return false;
  end if;
  if v_max_edad is not null and coalesce(v_pet.edad_anios, 0) > v_max_edad then
    return false;
  end if;

  if coalesce((p_criteria->>'compatibleNinos')::boolean, false)
    and not v_pet.compatible_ninos then
    return false;
  end if;
  if coalesce((p_criteria->>'compatiblePerros')::boolean, false)
    and not v_pet.compatible_perros then
    return false;
  end if;
  if coalesce((p_criteria->>'compatibleGatos')::boolean, false)
    and not v_pet.compatible_gatos then
    return false;
  end if;

  v_ciudad := trim(coalesce(p_criteria->>'ciudad', ''));
  if v_ciudad <> '' and v_pet.ciudad not ilike '%' || v_ciudad || '%' then
    return false;
  end if;

  v_estado := trim(coalesce(p_criteria->>'estado', ''));
  if v_estado <> '' and v_pet.refugio_estado not ilike '%' || v_estado || '%' then
    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.pet_matches_criteria_json(uuid, jsonb) to authenticated;

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
  where p.id = p_pet_id and p.estado_adopcion = 'disponible';

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
    and (TG_OP = 'INSERT' or OLD.estado_adopcion is distinct from 'disponible')
  then
    perform public.notify_users_for_new_pet(NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists pets_notify_search_alerts on public.pets;
create trigger pets_notify_search_alerts
  after insert or update of estado_adopcion on public.pets
  for each row execute function public.trg_pets_notify_search_alerts();
