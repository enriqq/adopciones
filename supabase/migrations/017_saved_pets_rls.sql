-- FEAT-006: RLS saved_pets (estricto por auth.uid())

drop policy if exists "saved_pets_select_own" on public.saved_pets;
create policy "saved_pets_select_own"
  on public.saved_pets for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "saved_pets_insert_own" on public.saved_pets;
create policy "saved_pets_insert_own"
  on public.saved_pets for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.pet_is_disponible(pet_id)
  );

drop policy if exists "saved_pets_delete_own" on public.saved_pets;
create policy "saved_pets_delete_own"
  on public.saved_pets for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.saved_pets to authenticated;

drop policy if exists "pets_select_saved_by_user" on public.pets;
create policy "pets_select_saved_by_user"
  on public.pets for select
  to authenticated
  using (
    exists (
      select 1 from public.saved_pets s
      where s.pet_id = pets.id and s.user_id = auth.uid()
    )
  );
