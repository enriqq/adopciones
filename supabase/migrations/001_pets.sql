-- FEAT-001: tablas refugios y pets

create table if not exists public.refugios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) >= 2),
  created_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  nombre text not null
    check (char_length(trim(nombre)) between 1 and 80),
  especie text not null
    check (especie in ('perro', 'gato', 'otro')),
  raza text not null
    check (char_length(trim(raza)) between 1 and 100),
  edad text not null
    check (char_length(trim(edad)) >= 2),
  temperamento text not null
    check (char_length(trim(temperamento)) between 3 and 500),
  descripcion text not null
    check (char_length(trim(descripcion)) between 20 and 2000),
  fotos_url jsonb not null default '[]'::jsonb
    check (jsonb_typeof(fotos_url) = 'array'),
  refugio_id uuid not null references public.refugios (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pets drop constraint if exists pets_fotos_url_min_one;
alter table public.pets add constraint pets_fotos_url_min_one
  check (jsonb_array_length(fotos_url) >= 1);

alter table public.pets drop constraint if exists pets_fotos_url_max_five;
alter table public.pets add constraint pets_fotos_url_max_five
  check (jsonb_array_length(fotos_url) <= 5);

create index if not exists pets_refugio_id_idx on public.pets (refugio_id);
create index if not exists pets_especie_idx on public.pets (especie);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pets_set_updated_at on public.pets;
create trigger pets_set_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();
