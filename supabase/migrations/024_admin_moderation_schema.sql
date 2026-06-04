-- FEAT-009: perfiles, roles, moderación de mascotas y auditoría

do $$ begin
  create type public.system_role as enum ('user', 'shelter', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.pet_moderation_status as enum (
    'pending',
    'approved',
    'suspended'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.profile_account_status as enum ('active', 'suspended');
exception when duplicate_object then null;
end $$;

-- ─── profiles ───────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  system_role public.system_role not null default 'user',
  display_name text not null
    check (char_length(trim(display_name)) >= 2),
  email text,
  account_status public.profile_account_status not null default 'active',
  suspension_reason text,
  suspended_at timestamptz,
  suspended_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_suspension_reason_when_suspended check (
    account_status <> 'suspended'
    or (
      suspension_reason is not null
      and char_length(trim(suspension_reason)) between 10 and 500
    )
  )
);

create index if not exists profiles_system_role_idx
  on public.profiles (system_role);

create index if not exists profiles_account_status_idx
  on public.profiles (account_status);

alter table public.profiles enable row level security;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table public.profiles is
  'Perfil unificado de usuario con system_role (FEAT-009)';

-- Backfill adoptantes
insert into public.profiles (id, system_role, display_name, email)
select a.id, 'user'::public.system_role, a.nombre, a.email
from public.applicants a
on conflict (id) do nothing;

-- Backfill refugios (priorizar shelter)
insert into public.profiles (id, system_role, display_name, email)
select r.user_id, 'shelter'::public.system_role, r.nombre, null
from public.refugios r
on conflict (id) do update
  set system_role = 'shelter',
      display_name = excluded.display_name;

-- ─── pets.moderation_status ─────────────────────────────────────────────────

alter table public.pets
  add column if not exists moderation_status public.pet_moderation_status
    not null default 'pending',
  add column if not exists moderation_reason text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references auth.users (id) on delete set null;

alter table public.pets drop constraint if exists pets_moderation_reason_when_suspended;
alter table public.pets
  add constraint pets_moderation_reason_when_suspended
    check (
      moderation_status <> 'suspended'
      or (
        moderation_reason is not null
        and char_length(trim(moderation_reason)) between 10 and 500
      )
    );

create index if not exists pets_moderation_status_idx
  on public.pets (moderation_status);

update public.pets
set moderation_status = 'approved'
where moderation_status = 'pending'
  and estado_adopcion in ('disponible', 'en_proceso', 'adoptado');

-- ─── moderation_logs ────────────────────────────────────────────────────────

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  reason text not null
    check (char_length(trim(reason)) between 10 and 500),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint moderation_logs_action_check check (
    action in (
      'pet_approve', 'pet_suspend', 'pet_delete',
      'user_suspend', 'user_unsuspend', 'user_delete',
      'profile_update_admin'
    )
  ),
  constraint moderation_logs_target_type_check check (
    target_type in ('pet', 'profile', 'refugio', 'applicant')
  )
);

create index if not exists moderation_logs_created_idx
  on public.moderation_logs (created_at desc);

alter table public.moderation_logs enable row level security;

-- ─── funciones ──────────────────────────────────────────────────────────────

create or replace function public.current_user_system_role()
returns public.system_role
language sql stable security definer set search_path = public as $$
  select p.system_role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.system_role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.current_user_system_role() from public;
revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_system_role() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;

-- ─── vistas admin ───────────────────────────────────────────────────────────

create or replace view public.v_admin_pets_moderation as
select
  p.id,
  p.nombre,
  p.especie,
  p.raza,
  p.estado_adopcion,
  p.moderation_status,
  p.moderation_reason,
  p.moderated_at,
  p.created_at,
  r.nombre as refugio_nombre,
  pr.id as owner_profile_id,
  pr.display_name as owner_display_name,
  pr.system_role as owner_system_role,
  pr.account_status as owner_account_status
from public.pets p
inner join public.refugios r on r.id = p.refugio_id
inner join public.profiles pr on pr.id = r.user_id;

create or replace view public.v_admin_users_moderation as
select
  p.id as profile_id,
  p.system_role,
  p.display_name,
  p.email,
  p.account_status,
  p.suspension_reason,
  p.suspended_at,
  p.created_at,
  exists (select 1 from public.refugios r where r.user_id = p.id) as has_refugio,
  exists (select 1 from public.applicants a where a.id = p.id) as has_applicant
from public.profiles p;

-- ─── triggers sincronización ────────────────────────────────────────────────

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, system_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

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
          when public.profiles.system_role = 'admin'::public.system_role then 'admin'::public.system_role
          else 'shelter'::public.system_role
        end,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

create or replace function public.guard_profile_system_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.system_role is distinct from old.system_role then
    if not public.current_user_is_admin() then
      new.system_role := old.system_role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_system_role on public.profiles;
create trigger guard_profile_system_role
  before update on public.profiles
  for each row execute function public.guard_profile_system_role();

drop trigger if exists refugios_sync_profile_shelter on public.refugios;
create trigger refugios_sync_profile_shelter
  after insert on public.refugios
  for each row execute function public.sync_profile_shelter_role();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();
