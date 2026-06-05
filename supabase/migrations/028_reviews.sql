-- FEAT-010: valoraciones y comentarios de refugios (tabla reviews)

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null
    references auth.users (id) on delete cascade,
  shelter_id uuid not null
    references public.refugios (id) on delete cascade,
  rating_1_to_5 smallint not null
    check (rating_1_to_5 between 1 and 5),
  comment text not null
    check (char_length(trim(comment)) between 10 and 2000),
  created_at timestamptz not null default now(),
  constraint reviews_one_per_user_per_shelter unique (shelter_id, reviewer_id)
);

create index if not exists reviews_shelter_created_idx
  on public.reviews (shelter_id, created_at desc);

create index if not exists reviews_reviewer_idx
  on public.reviews (reviewer_id);

comment on table public.reviews is
  'Valoraciones públicas de refugios por adoptantes autenticados (FEAT-010)';

-- Vista pública con nombre del revisor (security definer vía función auxiliar)
create or replace function public.reviewer_display_label(p_reviewer_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select nullif(trim(a.nombre), '')
      from public.applicants a
      where a.id = p_reviewer_id
    ),
    'Adoptante'
  );
$$;

create or replace view public.v_public_reviews as
select
  r.id,
  r.reviewer_id,
  r.shelter_id,
  r.rating_1_to_5,
  r.comment,
  r.created_at,
  public.reviewer_display_label(r.reviewer_id) as reviewer_display_name
from public.reviews r;

comment on view public.v_public_reviews is
  'Reseñas con etiqueta de revisor para lectura pública (FEAT-010)';

-- ¿auth.uid() es dueño del refugio?
create or replace function public.is_shelter_owner(p_shelter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refugios r
    where r.id = p_shelter_id
      and r.user_id = auth.uid()
  );
$$;

grant execute on function public.is_shelter_owner(uuid) to authenticated;

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select
  to anon, authenticated
  using (true);

drop policy if exists "reviews_insert_authenticated_not_owner" on public.reviews;
create policy "reviews_insert_authenticated_not_owner"
  on public.reviews for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and not public.is_shelter_owner(shelter_id)
  );

grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
grant select on public.v_public_reviews to anon, authenticated;

-- RPC: promedio de calificación por refugio
create or replace function public.get_shelter_avg_rating(p_shelter_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select json_build_object(
        'avg_rating', round(avg(r.rating_1_to_5)::numeric, 1),
        'review_count', count(*)::int
      )
      from public.reviews r
      where r.shelter_id = p_shelter_id
    ),
    json_build_object('avg_rating', null, 'review_count', 0)
  );
$$;

grant execute on function public.get_shelter_avg_rating(uuid) to anon, authenticated;
