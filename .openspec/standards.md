# Estándares del proyecto — Plataforma de adopción de mascotas

## Arquitectura

- **Frontend:** React con Vite.
- **Patrón:** Arquitectura basada en **componentes funcionales** de React.
- **Lógica reutilizable:** **Hooks personalizados** (`use*` en `src/hooks/`) para estado, datos y efectos secundarios.
- **Backend:** **Supabase** como BaaS (autenticación, base de datos PostgreSQL, almacenamiento y Row Level Security).

### Organización sugerida

```
src/
  components/   # UI presentacional y contenedores
  hooks/        # Hooks personalizados
  lib/          # Cliente Supabase y utilidades
  pages/        # Vistas por ruta
  services/     # Consultas y mutaciones alineadas al contrato de datos
```

## Diseño visual

| Rol | Valor | Uso |
|-----|-------|-----|
| Primario | **Naranja Terracota** `#E07A5F` | CTAs, acentos, enlaces activos |
| Secundario | **Verde Salvia** `#81B29A` | Éxito, estados positivos, apoyo visual |
| Tipografía títulos | **Nunito** | Encabezados y marca |
| Tipografía cuerpo | **Inter** | Texto, formularios, UI |

En Tailwind (v4): `text-primary`, `bg-primary`, `text-secondary`, `bg-secondary` según tokens en `src/index.css`.

## Stack de dependencias

- **Estilos:** Tailwind CSS
- **Iconos:** `lucide-react`
- **Alertas:** `sweetalert2`
- **Datos / auth:** `@supabase/supabase-js`

## Contratos y especificaciones (SDD)

- Propuestas activas: `specs/features/`
- Historial completado: `specs/archive/`
- Cada spec debe definir: decisiones de arquitectura, **schema Supabase / RLS**, criterios de aceptación y **tareas atómicas**.
- El código generado debe cumplir el contrato al 100% antes de archivar.

## Convenciones de código

- Componentes en PascalCase; hooks en camelCase con prefijo `use`.
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (nunca commitear claves reales).
- Consultas Supabase encapsuladas en `services/` o hooks, no dispersas en JSX.
- Validar reglas de negocio en cliente y confiar en RLS en servidor.

## Calidad

- Linting sin errores antes de considerar una feature verificada.
- Tests alineados al contrato de la spec activa cuando la spec lo exija.
