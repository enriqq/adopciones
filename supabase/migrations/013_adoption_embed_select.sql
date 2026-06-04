-- FEAT-004: adoptante puede leer pets/refugios de sus solicitudes (cualquier estado)

drop policy if exists "pets_select_applicant_applied" on public.pets;
create policy "pets_select_applicant_applied"
  on public.pets for select
  to authenticated
  using (
    exists (
      select 1 from public.adoption_applications a
      where a.pet_id = pets.id and a.applicant_id = auth.uid()
    )
  );

drop policy if exists "refugios_select_applicant_applied" on public.refugios;
create policy "refugios_select_applicant_applied"
  on public.refugios for select
  to authenticated
  using (
    exists (
      select 1 from public.adoption_applications a
      join public.pets p on p.id = a.pet_id
      where p.refugio_id = refugios.id and a.applicant_id = auth.uid()
    )
  );
