-- FEAT-002: RLS lectura pública solo mascotas disponibles

drop policy if exists "pets_select_public" on public.pets;

create policy "pets_select_disponible_public"
  on public.pets for select
  to anon, authenticated
  using (estado_adopcion = 'disponible');

drop policy if exists "pets_select_owner_all_status" on public.pets;
create policy "pets_select_owner_all_status"
  on public.pets for select
  to authenticated
  using (
    exists (
      select 1 from public.refugios r
      where r.id = pets.refugio_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "refugios_select_public_catalog" on public.refugios;
create policy "refugios_select_public_catalog"
  on public.refugios for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.pets p
      where p.refugio_id = refugios.id
        and p.estado_adopcion = 'disponible'
    )
  );
