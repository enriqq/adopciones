-- FEAT-008: RLS messages

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select to authenticated
  using (
    (sender_id = auth.uid() or receiver_id = auth.uid())
    and public.user_can_access_application(application_id)
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
      where a.id = application_id
        and (
          (a.applicant_id = auth.uid() and receiver_id = r.user_id)
          or (r.user_id = auth.uid() and receiver_id = a.applicant_id)
        )
    )
  );

grant select, insert on public.messages to authenticated;
