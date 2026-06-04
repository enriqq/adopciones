-- FEAT-003: RLS medical_records

create or replace function public.pet_is_disponible(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pets p
    where p.id = p_pet_id and p.estado_adopcion = 'disponible'
  );
$$;

grant execute on function public.pet_is_disponible(uuid) to anon, authenticated;

create policy "medical_records_select_disponible_public"
  on public.medical_records for select
  to anon, authenticated
  using (public.pet_is_disponible(pet_id));

create policy "medical_records_select_owner"
  on public.medical_records for select
  to authenticated
  using (
    exists (
      select 1 from public.pets p
      join public.refugios r on r.id = p.refugio_id
      where p.id = medical_records.pet_id and r.user_id = auth.uid()
    )
  );

create policy "medical_records_insert_owner"
  on public.medical_records for insert
  to authenticated
  with check (
    exists (
      select 1 from public.pets p
      join public.refugios r on r.id = p.refugio_id
      where p.id = pet_id and r.user_id = auth.uid()
    )
  );

create policy "medical_records_update_owner"
  on public.medical_records for update
  to authenticated
  using (
    exists (
      select 1 from public.pets p
      join public.refugios r on r.id = p.refugio_id
      where p.id = medical_records.pet_id and r.user_id = auth.uid()
    )
  );

create policy "medical_records_delete_owner"
  on public.medical_records for delete
  to authenticated
  using (
    exists (
      select 1 from public.pets p
      join public.refugios r on r.id = p.refugio_id
      where p.id = medical_records.pet_id and r.user_id = auth.uid()
    )
  );

grant select on public.medical_records to anon, authenticated;
grant insert, update, delete on public.medical_records to authenticated;
