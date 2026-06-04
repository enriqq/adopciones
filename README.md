# Plataforma de adopción de mascotas

React + Vite + Tailwind CSS + Supabase (FEAT-001–004 archivados, FEAT-005 en curso).

## Requisitos

- Node.js 18+
- Proyecto en [Supabase](https://supabase.com)

## Instalación

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local` con tu URL y clave anónima del proyecto Supabase.

## Migraciones Supabase

En el **SQL Editor** del dashboard, ejecuta en orden:

1. `supabase/migrations/001_pets.sql` — tablas `refugios` y `pets`
2. `supabase/migrations/002_pets_rls.sql` — políticas RLS
3. `supabase/migrations/003_storage_pet_photos.sql` — bucket `pet-photos`
4. `supabase/migrations/004_grants.sql` — lectura pública `pets` (rol `anon`)
5. `supabase/migrations/005_pet_search.sql` — campos de búsqueda e índices
6. `supabase/migrations/006_pets_rls_disponible.sql` — RLS solo mascotas `disponible`
7. `supabase/migrations/007_grants_refugios_catalog.sql` — SELECT en `refugios` para catálogo anónimo
8. `supabase/migrations/008_fix_rls_recursion.sql` — **obligatorio si ves "infinite recursion" en refugios**
9. `supabase/migrations/009_medical_records.sql` — tabla `medical_records` + `pets.requisitos_especiales`
10. `supabase/migrations/010_medical_records_rls.sql` — RLS lectura pública de registros médicos (mascotas `disponible`)
11. `supabase/migrations/011_adoption_applications.sql` — `applicants`, `adoption_applications`, enum `status`
12. `supabase/migrations/012_adoption_applications_rls.sql` — RLS estricto adoptante / refugio
13. `supabase/migrations/013_adoption_embed_select.sql` — SELECT `pets`/`refugios` para embed en Mis Solicitudes
14. `supabase/migrations/014_refuge_application_mgmt.sql` — `applicants.email`, decisión en solicitudes, `adoption_messages`, vista `v_refuge_application_rows`
15. `supabase/migrations/015_refuge_application_mgmt_rls.sql` — UPDATE `status` refugio, trigger guard, RLS mensajes
16. `supabase/migrations/016_saved_pets.sql` — tabla `saved_pets`, vista `v_user_saved_pets`
17. `supabase/migrations/017_saved_pets_rls.sql` — RLS favoritos (`auth.uid()`), `pets_select_saved_by_user`
18. `supabase/migrations/018_saved_pets_embed_rls.sql` — SELECT `refugios`/`medical_records` para embed de favoritos
19. `supabase/migrations/019_search_alerts_notifications.sql` — tablas `search_alerts` y `notifications`, matching, trigger en `pets`
20. `supabase/migrations/020_search_alerts_notifications_rls.sql` — RLS alertas/notificaciones, guard de inmutabilidad en `notifications`
21. `supabase/migrations/021_messages.sql` — tabla `messages`, migración desde `adoption_messages`, Realtime
22. `supabase/migrations/022_messages_rls.sql` — RLS chat (remitente INSERT; participantes SELECT)
23. `supabase/migrations/024_admin_moderation_schema.sql` — `profiles`, `system_role`, `pets.moderation_status`, logs
24. `supabase/migrations/025_admin_moderation_rls.sql` — RLS admin global; catálogo solo mascotas `approved`
25. `supabase/migrations/026_admin_moderation_catalog_helpers.sql` — helpers catálogo, alertas y alias `is_platform_admin`
26. `supabase/migrations/027_fix_admin_role_bootstrap.sql` — arreglo promoción a `admin` desde SQL Editor

### Administrador de plataforma (FEAT-009)

1. Aplica las migraciones hasta **`027_fix_admin_role_bootstrap.sql`** (incluye el arreglo del trigger que bloqueaba el primer admin).
2. Crea el usuario en **Authentication → Users** y copia su **UUID**.
3. En **SQL Editor** (no uses Table Editor para cambiar el rol), ejecuta **una** de estas opciones:

```sql
-- Recomendado: crea perfil si falta y asigna admin
select public.bootstrap_platform_admin('00000000-0000-0000-0000-000000000000'::uuid);

-- Alternativa (tras migración 027):
update public.profiles
set system_role = 'admin'
where id = '00000000-0000-0000-0000-000000000000'::uuid;
```

4. Comprueba:

```sql
select id, display_name, system_role from public.profiles where system_role = 'admin';
```

5. Cierra sesión en la app y vuelve a entrar con ese usuario; abre **`/admin`**.

> **Importante:** No puedes volverte admin desde la app ni editando `profiles` en Table Editor con tu sesión normal: RLS y el trigger lo impiden. Un admin ya existente puede promover a otros solo vía SQL Editor o si tú añades una UI interna futura.

### Usuario refugio de prueba

1. En **Authentication → Users**, crea un usuario (email + contraseña) o regístrate desde la app.
2. Tras el primer login, la app crea automáticamente un registro en `refugios` si no existe.
3. Al registrarte desde la UI también puedes indicar el nombre del refugio.

Verifica en **Table Editor → refugios** que `user_id` coincida con el UUID del usuario en Auth.

## Desarrollo

```bash
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |

## Estructura relevante

```
src/
  pages/BrowsePetsPage.jsx
  pages/CreatePetPage.jsx
  components/pets/PetDetail.jsx
  components/pets/PetPhotoCarousel.jsx
  components/pets/PetMedicalCard.jsx
  components/search/PetSearchSidebar.jsx
  components/search/PetResultsGrid.jsx
  components/search/PetCard.jsx
  components/search/PetGridSkeleton.jsx
  hooks/usePetsSearch.js
  hooks/usePetDetail.js
  hooks/useApplicant.js
  hooks/useMyApplications.js
  hooks/useAdoptionFormState.js
  hooks/useDebouncedValue.js
  services/petSearchService.js
  services/petDetailService.js
  services/adoptionApplicationService.js
  components/adoption/AdoptionForm.jsx
  pages/AdoptionApplicationPage.jsx
  pages/MyApplicationsPage.jsx
  pages/FavoritesPage.jsx
  hooks/useFavorites.js
  services/savedPetsService.js
  hooks/useNotifications.js
  services/searchAlertService.js
  services/notificationService.js
  components/notifications/NotificationDropdown.jsx
  components/notifications/SearchAlertSaveButton.jsx
  components/messaging/ApplicationChat.jsx
  hooks/useChat.js
  services/messageService.js
  services/profileService.js
  services/adminModerationService.js
  hooks/useProfile.js
  hooks/useAdminModeration.js
  routes/AppRoutes.jsx
  pages/admin/AdminDashboard.jsx
  components/auth/RequireAdmin.jsx
  components/auth/ApplicantAuthPanel.jsx
specs/archive/feat-004-solicitud-adopcion.md
specs/features/feat-005-gestion-solicitudes-refugio.md
specs/archive/feat-006-favoritos-adoptante.md
specs/archive/feat-007-notificaciones-busqueda.md
.openspec/standards.md
```

## Especificación

- FEAT-001 archivada: `specs/archive/feat-001-perfil-mascota.md`
- FEAT-002 archivada: `specs/archive/feat-002-busqueda-adoptante.md`
- FEAT-003 archivada: `specs/archive/feat-003-detalle-mascota.md`
- FEAT-004 archivada: `specs/archive/feat-004-solicitud-adopcion.md`
- FEAT-005 activa: `specs/features/feat-005-gestion-solicitudes-refugio.md`
- FEAT-006 archivada: `specs/archive/feat-006-favoritos-adoptante.md`
- FEAT-007 archivada: `specs/archive/feat-007-notificaciones-busqueda.md`
- FEAT-008 archivada: `specs/archive/feat-008-mensajeria-refugio-adoptante.md`
- FEAT-009 propuesta: `specs/features/feat-009-moderacion-admin.md` (`profiles.system_role`, panel `/admin`, RLS admin)
- Flujo OpenSpec: `.cursor/custom-commands.json`
