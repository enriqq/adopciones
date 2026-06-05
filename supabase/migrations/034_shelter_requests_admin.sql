-- Admin RBAC: lectura global de shelter_requests y rechazo administrativo

create or replace function public.list_shelter_requests()
returns setof public.shelter_requests
language sql
security definer
set search_path = public
as $$
  select *
  from public.shelter_requests
  order by created_at desc;
$$;

grant execute on function public.list_shelter_requests() to authenticated;

drop policy if exists "shelter_requests_select_admin" on public.shelter_requests;
create policy "shelter_requests_select_admin"
  on public.shelter_requests for select
  to authenticated
  using (public.current_user_is_admin());

create or replace function public.reject_shelter_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.shelter_requests%rowtype;
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo administradores pueden rechazar solicitudes.';
  end if;

  update public.shelter_requests
  set
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = p_request_id
    and status = 'pending'
  returning * into v_req;

  if not found then
    raise exception 'La solicitud no existe, ya fue procesada o no está pendiente.';
  end if;

  return v_req.id;
end;
$$;

grant execute on function public.reject_shelter_request(uuid) to authenticated;