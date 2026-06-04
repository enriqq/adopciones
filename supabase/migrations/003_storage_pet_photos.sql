-- FEAT-001: bucket pet-photos (ejecutar en SQL Editor de Supabase)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública
drop policy if exists "pet_photos_storage_read" on storage.objects;
create policy "pet_photos_storage_read"
  on storage.objects for select
  using (bucket_id = 'pet-photos');

-- Subida: carpeta raíz = refugio_id del usuario autenticado
drop policy if exists "pet_photos_storage_insert" on storage.objects;
create policy "pet_photos_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select r.id::text from public.refugios r where r.user_id = auth.uid()
    )
  );

drop policy if exists "pet_photos_storage_update" on storage.objects;
create policy "pet_photos_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select r.id::text from public.refugios r where r.user_id = auth.uid()
    )
  );

drop policy if exists "pet_photos_storage_delete" on storage.objects;
create policy "pet_photos_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select r.id::text from public.refugios r where r.user_id = auth.uid()
    )
  );
