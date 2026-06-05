import { Link } from 'react-router-dom'
import { ArrowLeft, Inbox, Shield } from 'lucide-react'
import { useManageApplications } from '../hooks/useManageApplications.js'
import { usePets } from '../hooks/usePets.js'
import RefugeApplicationsDashboard from '../components/refuge/RefugeApplicationsDashboard.jsx'
import ShelterRequestsAdminPanel from '../components/refuge/ShelterRequestsAdminPanel.jsx'

/**
 * Panel de gestión de solicitudes para refugios (/shelter-dashboard).
 *
 * @param {{
 *   currentUserId: string | null,
 *   systemRole: 'shelter' | 'admin' | null,
 *   isLoadingProfile?: boolean,
 * }} props
 */
export default function ShelterDashboardPage({
  currentUserId,
  systemRole,
  isLoadingProfile = false,
}) {
  const isAdmin = systemRole === 'admin'
  const isShelter = systemRole === 'shelter'
  const pageShellClass = 'min-h-svh bg-gradient-to-b from-orange-50/70 via-white to-green-50/50'

  if (isLoadingProfile || !systemRole) {
    return (
      <div className={pageShellClass}>
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <p className="text-sm text-gray-500 p-6 font-body">Cargando panel…</p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className={pageShellClass}>
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition font-body"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Inicio
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gray-700 backdrop-blur">
              <Shield className="w-3.5 h-3.5 text-primary" aria-hidden />
              Administración
            </span>
          </div>

          <ShelterRequestsAdminPanel />
        </div>
      </div>
    )
  }

  if (isShelter) {
    return (
      <div className={pageShellClass}>
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10 space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <Inbox className="w-7 h-7" aria-hidden />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
                    Refugio activo
                  </div>
                  <div>
                    <h1 className="font-heading text-3xl text-gray-900 md:text-4xl">
                      Panel del refugio
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 font-body md:text-base">
                      Gestiona solicitudes de adopción, revisa estados y coordina respuestas con tu equipo.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden />
                Inicio
              </Link>
            </div>
          </div>

          <ShelterManagementPanel currentUserId={currentUserId} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
      <h2 className="font-heading text-xl text-gray-900">Panel no disponible</h2>
      <p className="text-sm text-gray-600 font-body">
        No se pudo determinar el rol de tu cuenta para mostrar el panel correcto.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline font-body"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Volver al inicio
      </Link>
    </div>
  )
}

function ShelterManagementPanel({ currentUserId }) {
  const { refugioId, refugioNombre, isLoadingRefugio } = usePets()
  const manage = useManageApplications(refugioId)

  if (isLoadingRefugio) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-gray-500 font-body">Cargando panel del refugio…</p>
      </div>
    )
  }

  if (!refugioId) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white/90 p-8 text-center shadow-sm">
        <h2 className="font-heading text-xl text-gray-900">Sin refugio asociado</h2>
        <p className="text-sm text-gray-600 font-body">
          Tu cuenta aún no tiene un refugio activo. Solicita una cuenta de refugio desde{' '}
          <strong>Mis solicitudes</strong> en el inicio.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline font-body"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition font-body"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Inicio
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Inbox className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-gray-900">Panel del refugio</h1>
            <p className="text-sm text-gray-600 font-body">{refugioNombre}</p>
          </div>
        </div>
      </div>

      <RefugeApplicationsDashboard
        {...manage}
        refugioNombre={refugioNombre}
        currentUserId={currentUserId}
      />
    </div>
  )
}
