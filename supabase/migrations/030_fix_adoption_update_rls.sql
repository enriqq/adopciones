-- RBAC delta: corregir UPDATE de adoption_applications para dueños del refugio

create or replace function public.auth_owns_adoption_application_pet(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.adoption_applications a
    inner join public.pets p on p.id = a.pet_id
    inner join public.refugios r on r.id = p.refugio_id
    where a.id = p_application_id
      and r.user_id = auth.uid()
  );
$$;

create or replace function public.is_pet_owned_by_auth_refugio(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pets p
    inner join public.refugios r on r.id = p.refugio_id
    where p.id = p_pet_id
      and r.user_id = auth.uid()
  );
$$;

grant execute on function public.auth_owns_adoption_application_pet(uuid) to authenticated;
grant execute on function public.is_pet_owned_by_auth_refugio(uuid) to authenticated;

drop policy if exists "adoption_applications_update_refugio" on public.adoption_applications;
create policy "adoption_applications_update_refugio"
  on public.adoption_applications for update
  to authenticated
  using (
    public.auth_owns_adoption_application_pet(id)
    and status = 'pending'
  )
  with check (
    public.auth_owns_adoption_application_pet(id)
    and status in ('approved', 'rejected')
  );

grant update on public.adoption_applications to authenticated;
