-- FEAT-005: RLS gestión refugio + mensajes

create or replace function public.user_can_access_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.adoption_applications a
    where a.id = p_application_id
      and (
        a.applicant_id = auth.uid()
        or public.is_pet_owned_by_auth_refugio(a.pet_id)
      )
  );
$$;

grant execute on function public.user_can_access_application(uuid) to authenticated;

create or replace function public.guard_application_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_pet_owned_by_auth_refugio(old.pet_id) then
    return new;
  end if;

  if new.pet_id is distinct from old.pet_id
    or new.applicant_id is distinct from old.applicant_id
    or new.tipo_vivienda is distinct from old.tipo_vivienda
    or new.tiene_patio is distinct from old.tiene_patio
    or new.otras_mascotas is distinct from old.otras_mascotas
    or new.experiencia_previa is distinct from old.experiencia_previa
    or new.horas_solo is distinct from old.horas_solo
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Solo se permite actualizar status y datos de decisión.';
  end if;

  return new;
end;
$$;

drop trigger if exists adoption_applications_guard_status_update on public.adoption_applications;
create trigger adoption_applications_guard_status_update
  before update on public.adoption_applications
  for each row execute function public.guard_application_status_update();

drop policy if exists "applicants_select_refugio_via_application" on public.applicants;
create policy "applicants_select_refugio_via_application"
  on public.applicants for select to authenticated
  using (
    exists (
      select 1 from public.adoption_applications a
      where a.applicant_id = applicants.id
        and public.is_pet_owned_by_auth_refugio(a.pet_id)
    )
  );

drop policy if exists "adoption_applications_update_refugio" on public.adoption_applications;
create policy "adoption_applications_update_refugio"
  on public.adoption_applications for update
  to authenticated
  using (
    public.is_pet_owned_by_auth_refugio(pet_id)
    and status = 'pending'
  )
  with check (
    public.is_pet_owned_by_auth_refugio(pet_id)
    and status in ('approved', 'rejected')
  );

drop policy if exists "adoption_messages_select_participant" on public.adoption_messages;
create policy "adoption_messages_select_participant"
  on public.adoption_messages for select to authenticated
  using (public.user_can_access_application(application_id));

drop policy if exists "adoption_messages_insert_participant" on public.adoption_messages;
create policy "adoption_messages_insert_participant"
  on public.adoption_messages for insert to authenticated
  with check (
    public.user_can_access_application(application_id)
    and sender_id = auth.uid()
    and (
      (
        sender_role = 'applicant'
        and exists (
          select 1 from public.adoption_applications a
          where a.id = application_id and a.applicant_id = auth.uid()
        )
      )
      or (
        sender_role = 'refugio'
        and exists (
          select 1 from public.adoption_applications a
          where a.id = application_id
            and public.is_pet_owned_by_auth_refugio(a.pet_id)
        )
      )
    )
  );

grant select, insert on public.adoption_messages to authenticated;
