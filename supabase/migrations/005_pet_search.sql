-- FEAT-002: campos de búsqueda e índices de rendimiento

create extension if not exists pg_trgm;

-- refugios: ubicación
alter table public.refugios
  add column if not exists ciudad text,
  add column if not exists estado text;

update public.refugios
set ciudad = coalesce(ciudad, 'Sin especificar'),
    estado = coalesce(estado, 'Sin especificar')
where ciudad is null or estado is null;

alter table public.refugios
  alter column ciudad set not null,
  alter column estado set not null;

alter table public.refugios drop constraint if exists refugios_ciudad_len;
alter table public.refugios
  add constraint refugios_ciudad_len check (char_length(trim(ciudad)) >= 2);

alter table public.refugios drop constraint if exists refugios_estado_len;
alter table public.refugios
  add constraint refugios_estado_len check (char_length(trim(estado)) >= 2);

-- pets: filtros estructurados
alter table public.pets
  add column if not exists edad_anios int,
  add column if not exists edad_meses int not null default 0,
  add column if not exists tamano text,
  add column if not exists compatible_ninos boolean not null default false,
  add column if not exists compatible_perros boolean not null default false,
  add column if not exists compatible_gatos boolean not null default false,
  add column if not exists estado_adopcion text not null default 'disponible';

update public.pets
set edad_anios = coalesce(edad_anios, 0),
    edad_meses = coalesce(edad_meses, 0),
    tamano = coalesce(tamano, 'mediano'),
    estado_adopcion = coalesce(estado_adopcion, 'disponible')
where edad_anios is null or tamano is null;

alter table public.pets
  alter column edad_anios set not null;

alter table public.pets drop constraint if exists pets_edad_anios_range;
alter table public.pets
  add constraint pets_edad_anios_range check (edad_anios >= 0 and edad_anios <= 30);

alter table public.pets drop constraint if exists pets_edad_meses_range;
alter table public.pets
  add constraint pets_edad_meses_range check (edad_meses >= 0 and edad_meses <= 11);

alter table public.pets drop constraint if exists pets_tamano_check;
alter table public.pets
  add constraint pets_tamano_check check (tamano in ('pequeno', 'mediano', 'grande'));

alter table public.pets drop constraint if exists pets_estado_adopcion_check;
alter table public.pets
  add constraint pets_estado_adopcion_check
    check (estado_adopcion in ('disponible', 'en_proceso', 'adoptado'));

-- Índices generales
create index if not exists pets_especie_idx on public.pets (especie);
create index if not exists pets_raza_trgm_idx on public.pets using gin (raza gin_trgm_ops);

-- Tamaño
create index if not exists pets_tamano_idx on public.pets (tamano);

-- Parciales: solo disponibles
create index if not exists pets_disponible_estado_idx
  on public.pets (estado_adopcion)
  where estado_adopcion = 'disponible';

create index if not exists pets_disponible_tamano_idx
  on public.pets (tamano)
  where estado_adopcion = 'disponible';

create index if not exists pets_disponible_edad_idx
  on public.pets (edad_anios)
  where estado_adopcion = 'disponible';

create index if not exists pets_disponible_search_combo_idx
  on public.pets (especie, tamano, edad_anios)
  where estado_adopcion = 'disponible';

create index if not exists pets_disponible_compat_ninos_idx
  on public.pets (compatible_ninos)
  where estado_adopcion = 'disponible' and compatible_ninos = true;

create index if not exists pets_disponible_compat_perros_idx
  on public.pets (compatible_perros)
  where estado_adopcion = 'disponible' and compatible_perros = true;

create index if not exists pets_disponible_compat_gatos_idx
  on public.pets (compatible_gatos)
  where estado_adopcion = 'disponible' and compatible_gatos = true;

-- Ubicación refugio
create index if not exists refugios_ciudad_idx on public.refugios (ciudad);
create index if not exists refugios_estado_idx on public.refugios (estado);
create index if not exists refugios_ciudad_estado_idx on public.refugios (ciudad, estado);
