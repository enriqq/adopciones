-- FEAT-001: Row Level Security

alter table public.refugios enable row level security;
alter table public.pets enable row level security;

-- refugios
drop policy if exists "refugios_select_own" on public.refugios;
create policy "refugios_select_own"
  on public.refugios for select
  using (user_id = auth.uid());

drop policy if exists "refugios_insert_own" on public.refugios;
create policy "refugios_insert_own"
  on public.refugios for insert
  with check (user_id = auth.uid());

drop policy if exists "refugios_update_own" on public.refugios;
create policy "refugios_update_own"
  on public.refugios for update
  using (user_id = auth.uid());

-- pets: lectura pública
drop policy if exists "pets_select_public" on public.pets;
create policy "pets_select_public"
  on public.pets for select
  using (true);

drop policy if exists "pets_insert_owner_refugio" on public.pets;
create policy "pets_insert_owner_refugio"
  on public.pets for insert
  with check (
    exists (
      select 1 from public.refugios r
      where r.id = refugio_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "pets_update_owner_refugio" on public.pets;
create policy "pets_update_owner_refugio"
  on public.pets for update
  using (
    exists (
      select 1 from public.refugios r
      where r.id = pets.refugio_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.refugios r
      where r.id = refugio_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "pets_delete_owner_refugio" on public.pets;
create policy "pets_delete_owner_refugio"
  on public.pets for delete
  using (
    exists (
      select 1 from public.refugios r
      where r.id = pets.refugio_id
        and r.user_id = auth.uid()
    )
  );
