-- FEAT-004: RLS adoption_applications + applicants

create or replace function public.is_pet_owned_by_auth_refugio(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pets p
    join public.refugios r on r.id = p.refugio_id
    where p.id = p_pet_id and r.user_id = auth.uid()
  );
$$;

grant execute on function public.is_pet_owned_by_auth_refugio(uuid) to authenticated;

-- applicants
drop policy if exists "applicants_select_own" on public.applicants;
create policy "applicants_select_own"
  on public.applicants for select to authenticated
  using (id = auth.uid());

drop policy if exists "applicants_insert_own" on public.applicants;
create policy "applicants_insert_own"
  on public.applicants for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "applicants_update_own" on public.applicants;
create policy "applicants_update_own"
  on public.applicants for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- adoption_applications — adoptante
drop policy if exists "adoption_applications_insert_applicant" on public.adoption_applications;
create policy "adoption_applications_insert_applicant"
  on public.adoption_applications for insert
  to authenticated
  with check (
    applicant_id = auth.uid()
    and status = 'pending'
    and public.pet_is_disponible(pet_id)
  );

drop policy if exists "adoption_applications_select_applicant" on public.adoption_applications;
create policy "adoption_applications_select_applicant"
  on public.adoption_applications for select
  to authenticated
  using (applicant_id = auth.uid());

-- refugio
drop policy if exists "adoption_applications_select_refugio" on public.adoption_applications;
create policy "adoption_applications_select_refugio"
  on public.adoption_applications for select
  to authenticated
  using (public.is_pet_owned_by_auth_refugio(pet_id));

drop policy if exists "adoption_applications_update_refugio" on public.adoption_applications;
create policy "adoption_applications_update_refugio"
  on public.adoption_applications for update
  to authenticated
  using (public.is_pet_owned_by_auth_refugio(pet_id));

grant select, insert, update on public.applicants to authenticated;
grant select, insert on public.adoption_applications to authenticated;
grant update on public.adoption_applications to authenticated;
