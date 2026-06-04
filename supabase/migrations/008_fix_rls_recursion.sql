-- FEAT-002 fix: evitar recursión infinita RLS refugios ↔ pets
--
-- Causa: refugios_select_public_catalog consulta pets → pets_select_owner_all_status
-- consulta refugios → bucle infinito con sesión autenticada.

create or replace function public.is_refugio_owner(refugio_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refugios r
    where r.id = refugio_uuid
      and r.user_id = auth.uid()
  );
$$;

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
  );
$$;

revoke all on function public.is_refugio_owner(uuid) from public;
revoke all on function public.refugio_has_disponible_pets(uuid) from public;
grant execute on function public.is_refugio_owner(uuid) to anon, authenticated;
grant execute on function public.refugio_has_disponible_pets(uuid) to anon, authenticated;

-- pets: dueño ve todas sus mascotas (sin subquery recursivo a refugios)
drop policy if exists "pets_select_owner_all_status" on public.pets;
create policy "pets_select_owner_all_status"
  on public.pets for select
  to authenticated
  using (public.is_refugio_owner(refugio_id));

-- refugios: catálogo público (sin subquery recursivo a pets con RLS)
drop policy if exists "refugios_select_public_catalog" on public.refugios;
create policy "refugios_select_public_catalog"
  on public.refugios for select
  to anon, authenticated
  using (public.refugio_has_disponible_pets(id));

-- pets: mutaciones del dueño (mismo helper, evita recursión en INSERT)
drop policy if exists "pets_insert_owner_refugio" on public.pets;
create policy "pets_insert_owner_refugio"
  on public.pets for insert
  to authenticated
  with check (public.is_refugio_owner(refugio_id));

drop policy if exists "pets_update_owner_refugio" on public.pets;
create policy "pets_update_owner_refugio"
  on public.pets for update
  to authenticated
  using (public.is_refugio_owner(refugio_id))
  with check (public.is_refugio_owner(refugio_id));

drop policy if exists "pets_delete_owner_refugio" on public.pets;
create policy "pets_delete_owner_refugio"
  on public.pets for delete
  to authenticated
  using (public.is_refugio_owner(refugio_id));
