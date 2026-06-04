-- FEAT-005: gestión solicitudes refugio

alter table public.applicants
  add column if not exists email text not null default '';

alter table public.applicants drop constraint if exists applicants_email_format;
alter table public.applicants add constraint applicants_email_format
  check (
    char_length(trim(email)) = 0
    or (char_length(trim(email)) >= 5 and position('@' in trim(email)) > 1)
  );

alter table public.adoption_applications
  add column if not exists mensaje_decision text not null default '';

alter table public.adoption_applications drop constraint if exists adoption_applications_mensaje_decision_length;
alter table public.adoption_applications add constraint adoption_applications_mensaje_decision_length
  check (char_length(mensaje_decision) <= 1500);

alter table public.adoption_applications
  add column if not exists decided_at timestamptz;

alter table public.adoption_applications drop constraint if exists adoption_applications_decided_when_not_pending;
alter table public.adoption_applications add constraint adoption_applications_decided_when_not_pending
  check (
    (status = 'pending' and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  );

create table if not exists public.adoption_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.adoption_applications (id) on delete cascade,
  sender_role text not null check (sender_role in ('refugio', 'applicant')),
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) >= 2 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists adoption_messages_application_id_idx
  on public.adoption_messages (application_id, created_at);

alter table public.adoption_messages enable row level security;

create or replace view public.v_refuge_application_rows
with (security_invoker = true) as
select
  a.id,
  a.pet_id,
  a.applicant_id,
  a.status,
  a.mensaje_decision,
  a.decided_at,
  a.tipo_vivienda,
  a.tiene_patio,
  a.otras_mascotas,
  a.experiencia_previa,
  a.horas_solo,
  a.created_at,
  p.nombre as pet_nombre,
  p.especie as pet_especie,
  p.raza as pet_raza,
  p.fotos_url as pet_fotos_url,
  p.estado_adopcion as pet_estado_adopcion,
  p.refugio_id,
  u.nombre as applicant_nombre,
  u.telefono as applicant_telefono,
  u.email as applicant_email
from public.adoption_applications a
inner join public.pets p on p.id = a.pet_id
inner join public.applicants u on u.id = a.applicant_id;

grant select on public.v_refuge_application_rows to authenticated;
