import { useState } from 'react'
import { ChevronDown, ChevronUp, ClipboardList, MessageSquare, PawPrint, Search } from 'lucide-react'
import ApplicationChat from '../components/messaging/ApplicationChat.jsx'
import { useMyApplications } from '../hooks/useMyApplications.js'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-secondary/15 text-secondary border-secondary/30',
  rejected: 'bg-gray-100 text-red-700 border-red-200',
}

/**
 * @param {{
 *   userId: string | null,
 *   onExplore: () => void,
 * }} props
 */
export default function MyApplicationsPage({ userId, onExplore }) {
  const { applications, isLoading, error } = useMyApplications(userId)
  const [expandedId, setExpandedId] = useState(null)

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
        <p className="text-gray-600 text-sm">
          Inicia sesión como adoptante para ver tus solicitudes.
        </p>
      </div>
    )
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6" aria-labelledby="mis-solicitudes">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-secondary/15 text-secondary">
          <ClipboardList className="w-6 h-6" aria-hidden />
        </div>
        <div>
          <h2 id="mis-solicitudes" className="font-heading text-2xl text-gray-900">
            Mis solicitudes
          </h2>
          <p className="text-sm text-gray-600">Sigue el estado de tus solicitudes de adopción</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-gray-200 rounded-xl" />
          <div className="h-28 bg-gray-200 rounded-xl" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
          {error}
        </p>
      )}

      {!isLoading && !error && applications.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center space-y-4">
          <PawPrint className="w-12 h-12 mx-auto text-gray-300" aria-hidden />
          <p className="font-heading text-lg text-gray-800">Aún no has enviado solicitudes</p>
          <p className="text-sm text-gray-500">
            Explora el catálogo y pulsa Adoptar en la mascota que elijas.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Search className="w-4 h-4" aria-hidden />
            Explorar mascotas
          </button>
        </div>
      )}

      {!isLoading && applications.length > 0 && (
        <ul className="space-y-4">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id
            const hasDecision = app.status !== 'pending' && app.mensaje_decision?.trim()

            return (
              <li
                key={app.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {app.pet_foto ? (
                      <img
                        src={app.pet_foto}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-heading text-lg text-gray-900">{app.pet_nombre}</h3>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          STATUS_STYLES[app.status] ?? STATUS_STYLES.pending
                        }`}
                      >
                        {STATUS_LABELS[app.status] ?? app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">
                      {app.pet_especie} · {app.pet_raza}
                    </p>
                    <p className="text-xs text-gray-500">{app.refugio_nombre}</p>
                    <p className="text-xs text-gray-400">
                      Enviada el{' '}
                      {new Date(app.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>

                    {hasDecision && (
                      <div className="mt-2 text-sm bg-orange-50/80 border border-primary/10 rounded-lg p-3">
                        <p className="font-medium text-gray-800 text-xs mb-1">
                          Mensaje del refugio
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">{app.mensaje_decision}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium mt-1"
                    >
                      <MessageSquare className="w-4 h-4" aria-hidden />
                      {isExpanded ? 'Ocultar mensajes' : 'Ver mensajes'}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" aria-hidden />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50">
                    <ApplicationChat applicationId={app.id} currentUserId={userId} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
