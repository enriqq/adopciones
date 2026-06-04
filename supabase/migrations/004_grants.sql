-- FEAT-001: permisos para lectura pública de pets (CA-05)

grant usage on schema public to anon, authenticated;

grant select on public.pets to anon, authenticated;

grant select, insert, update, delete on public.refugios to authenticated;
grant select, insert, update, delete on public.pets to authenticated;
