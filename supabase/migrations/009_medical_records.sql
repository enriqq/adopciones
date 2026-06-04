-- FEAT-003: registro médico por mascota

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null unique references public.pets (id) on delete cascade,
  vacunas text not null
    check (char_length(trim(vacunas)) >= 2),
  esterilizado boolean not null default false,
  condiciones_especiales text not null default ''
    check (char_length(condiciones_especiales) <= 1500),
  notas_medicas text not null default ''
    check (char_length(notas_medicas) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medical_records_pet_id_idx
  on public.medical_records (pet_id);

create trigger medical_records_set_updated_at
  before update on public.medical_records
  for each row execute function public.set_updated_at();

alter table public.medical_records enable row level security;

alter table public.pets
  add column if not exists requisitos_especiales text not null default '';

alter table public.pets drop constraint if exists pets_requisitos_especiales_length;
alter table public.pets add constraint pets_requisitos_especiales_length
  check (char_length(requisitos_especiales) <= 1500);

comment on column public.pets.requisitos_especiales is 'Requisitos del hogar adoptante';
comment on column public.medical_records.vacunas is 'Estado de vacunación';
comment on column public.medical_records.condiciones_especiales is 'Condiciones médicas o cuidados especiales';
