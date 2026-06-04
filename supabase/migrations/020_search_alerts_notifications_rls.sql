-- FEAT-007: RLS alertas y notificaciones

drop policy if exists "search_alerts_select_own" on public.search_alerts;
create policy "search_alerts_select_own"
  on public.search_alerts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "search_alerts_insert_own" on public.search_alerts;
create policy "search_alerts_insert_own"
  on public.search_alerts for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "search_alerts_delete_own" on public.search_alerts;
create policy "search_alerts_delete_own"
  on public.search_alerts for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.search_alerts to authenticated;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_read_own" on public.notifications;
create policy "notifications_update_read_own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.notifications to authenticated;

create or replace function public.guard_notification_read_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Solo se permite actualizar is_read.';
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_guard_read_update on public.notifications;
create trigger notifications_guard_read_update
  before update on public.notifications
  for each row execute function public.guard_notification_read_update();
