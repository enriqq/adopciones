import { Link } from 'react-router-dom'
import { ArrowLeft, Inbox } from 'lucide-react'
import { useManageApplications } from '../hooks/useManageApplications.js'
import { usePets } from '../hooks/usePets.js'
import RefugeApplicationsDashboard from '../components/refuge/RefugeApplicationsDashboard.jsx'

/**
 * Panel de gestión de solicitudes para refugios (/shelter-dashboard).
 *
 * @param {{ currentUserId: string | null }} props
 */
export default function ShelterDashboardPage({ currentUserId }) {
  const { refugioId, refugioNombre, isLoadingRefugio } = usePets()
  const manage = useManageApplications(refugioId)

  if (isLoadingRefugio) {
    return (
      <p className="text-sm text-gray-500 p-6 font-body">Cargando panel del refugio…</p>
    )
  }

  if (!refugioId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
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
        refugioNombre={refugioNombre}
        manage={manage}
        currentUserId={currentUserId}
      />
    </div>
  )
}
