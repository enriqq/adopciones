-- FEAT-006: favoritos (saved_pets)

create table if not exists public.saved_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_pets_user_pet_unique unique (user_id, pet_id)
);

create index if not exists saved_pets_user_id_created_at_idx
  on public.saved_pets (user_id, created_at desc);

create index if not exists saved_pets_pet_id_idx
  on public.saved_pets (pet_id);

alter table public.saved_pets enable row level security;

comment on table public.saved_pets is
  'Mascotas guardadas como favoritas por usuario autenticado (FEAT-006)';

create or replace view public.v_user_saved_pets
with (security_invoker = true) as
select
  s.id as saved_id,
  s.user_id,
  s.pet_id,
  s.created_at as saved_at,
  p.nombre,
  p.especie,
  p.raza,
  p.edad,
  p.edad_anios,
  p.edad_meses,
  p.tamano,
  p.fotos_url,
  p.compatible_ninos,
  p.compatible_perros,
  p.compatible_gatos,
  p.estado_adopcion,
  p.refugio_id,
  r.nombre as refugio_nombre,
  r.ciudad,
  r.estado as refugio_estado
from public.saved_pets s
inner join public.pets p on p.id = s.pet_id
inner join public.refugios r on r.id = p.refugio_id;

grant select on public.v_user_saved_pets to authenticated;
