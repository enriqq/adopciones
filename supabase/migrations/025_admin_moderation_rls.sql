-- FEAT-009: RLS administración global y catálogo con moderación aprobada

-- pet_is_disponible incluye moderación aprobada
create or replace function public.pet_is_disponible(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pets p
    where p.id = p_pet_id
      and p.estado_adopcion = 'disponible'
      and p.moderation_status = 'approved'
  );
$$;

-- ─── profiles ───────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid() and system_role = 'user');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (
    id = auth.uid()
    and system_role <> 'admin'::public.system_role
  )
  with check (id = auth.uid());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete to authenticated
  using (
    public.current_user_is_admin()
    and id <> auth.uid()
  );

-- ─── pets (admin + catálogo) ────────────────────────────────────────────────

drop policy if exists "pets_select_disponible_public" on public.pets;
create policy "pets_select_disponible_public"
  on public.pets for select to anon, authenticated
  using (
    estado_adopcion = 'disponible'
    and moderation_status = 'approved'
  );

drop policy if exists "pets_select_admin" on public.pets;
create policy "pets_select_admin"
  on public.pets for select to authenticated
  using (public.current_user_is_admin());

drop policy if exists "pets_update_admin" on public.pets;
create policy "pets_update_admin"
  on public.pets for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "pets_delete_admin" on public.pets;
create policy "pets_delete_admin"
  on public.pets for delete to authenticated
  using (public.current_user_is_admin());

drop policy if exists "pets_insert_owner_refugio" on public.pets;
create policy "pets_insert_owner_refugio"
  on public.pets for insert to authenticated
  with check (
    public.is_refugio_owner(refugio_id)
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_status = 'active'
    )
  );

-- ─── refugios / applicants (admin) ──────────────────────────────────────────

drop policy if exists "refugios_select_admin" on public.refugios;
create policy "refugios_select_admin"
  on public.refugios for select to authenticated
  using (public.current_user_is_admin());

drop policy if exists "refugios_update_admin" on public.refugios;
create policy "refugios_update_admin"
  on public.refugios for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "refugios_delete_admin" on public.refugios;
create policy "refugios_delete_admin"
  on public.refugios for delete to authenticated
  using (public.current_user_is_admin());

drop policy if exists "applicants_select_admin" on public.applicants;
create policy "applicants_select_admin"
  on public.applicants for select to authenticated
  using (public.current_user_is_admin());

drop policy if exists "applicants_update_admin" on public.applicants;
create policy "applicants_update_admin"
  on public.applicants for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "applicants_delete_admin" on public.applicants;
create policy "applicants_delete_admin"
  on public.applicants for delete to authenticated
  using (public.current_user_is_admin());

-- ─── adoption_applications + messages ───────────────────────────────────────

drop policy if exists "adoption_applications_insert_applicant" on public.adoption_applications;
create policy "adoption_applications_insert_applicant"
  on public.adoption_applications for insert to authenticated
  with check (
    applicant_id = auth.uid()
    and status = 'pending'
    and public.pet_is_disponible(pet_id)
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_status = 'active'
    )
  );

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.user_can_access_application(application_id)
    and exists (
      select 1
      from public.adoption_applications a
      join public.pets p on p.id = a.pet_id
      join public.refugios r on r.id = p.refugio_id
      join public.profiles pr on pr.id = auth.uid()
      where a.id = application_id
        and pr.account_status = 'active'
        and (
          (a.applicant_id = auth.uid() and receiver_id = r.user_id)
          or (r.user_id = auth.uid() and receiver_id = a.applicant_id)
        )
    )
  );

-- ─── moderation_logs ──────────────────────────────────────────────────────────

drop policy if exists "moderation_logs_select_admin" on public.moderation_logs;
create policy "moderation_logs_select_admin"
  on public.moderation_logs for select to authenticated
  using (public.current_user_is_admin());

drop policy if exists "moderation_logs_insert_admin" on public.moderation_logs;
create policy "moderation_logs_insert_admin"
  on public.moderation_logs for insert to authenticated
  with check (
    public.current_user_is_admin()
    and admin_id = auth.uid()
  );

-- ─── grants ─────────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.v_admin_pets_moderation to authenticated;
grant select on public.v_admin_users_moderation to authenticated;
grant select, insert on public.moderation_logs to authenticated;
