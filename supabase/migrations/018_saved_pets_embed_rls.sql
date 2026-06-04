-- FEAT-006: embed refugios + medical_records para favoritos (mascotas no disponibles)

drop policy if exists "refugios_select_saved_by_user" on public.refugios;
create policy "refugios_select_saved_by_user"
  on public.refugios for select
  to authenticated
  using (
    exists (
      select 1 from public.saved_pets s
      inner join public.pets p on p.id = s.pet_id
      where p.refugio_id = refugios.id and s.user_id = auth.uid()
    )
  );

drop policy if exists "medical_records_select_saved_by_user" on public.medical_records;
create policy "medical_records_select_saved_by_user"
  on public.medical_records for select
  to authenticated
  using (
    exists (
      select 1 from public.saved_pets s
      where s.pet_id = medical_records.pet_id and s.user_id = auth.uid()
    )
  );
