-- FEAT-004: adoptantes y solicitudes de adopción

do $$ begin
  create type public.adoption_application_status as enum (
    'pending',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.applicants (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null
    check (char_length(trim(nombre)) >= 2),
  telefono text not null default ''
    check (
      char_length(regexp_replace(telefono, '\D', '', 'g')) = 0
      or char_length(regexp_replace(telefono, '\D', '', 'g')) >= 8
    ),
  created_at timestamptz not null default now()
);

alter table public.applicants enable row level security;

create table if not exists public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  applicant_id uuid not null references public.applicants (id) on delete cascade,
  status public.adoption_application_status not null default 'pending',
  tipo_vivienda text not null
    check (tipo_vivienda in ('casa', 'departamento', 'otro')),
  tiene_patio boolean not null default false,
  otras_mascotas text not null default ''
    check (char_length(otras_mascotas) <= 500),
  experiencia_previa text not null
    check (char_length(trim(experiencia_previa)) >= 20),
  horas_solo integer not null
    check (horas_solo >= 0 and horas_solo <= 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists adoption_applications_pet_id_idx
  on public.adoption_applications (pet_id);

create index if not exists adoption_applications_applicant_id_idx
  on public.adoption_applications (applicant_id);

create index if not exists adoption_applications_status_idx
  on public.adoption_applications (status);

create unique index if not exists adoption_applications_one_pending_per_applicant_pet
  on public.adoption_applications (pet_id, applicant_id)
  where status = 'pending';

drop trigger if exists adoption_applications_set_updated_at on public.adoption_applications;
create trigger adoption_applications_set_updated_at
  before update on public.adoption_applications
  for each row execute function public.set_updated_at();

alter table public.adoption_applications enable row level security;

comment on table public.applicants is 'Perfil de adoptante (FEAT-004)';
comment on table public.adoption_applications is 'Solicitudes de adopción';
