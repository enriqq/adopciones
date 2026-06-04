import { Inbox } from 'lucide-react'
import RefugeApplicationsDashboard from '../components/refuge/RefugeApplicationsDashboard.jsx'

/**
 * @param {{
 *   refugioNombre: string | null,
 *   manage: ReturnType<typeof import('../hooks/useManageApplications.js').useManageApplications>,
 *   currentUserId: string | null,
 * }} props
 */
export default function ShelterApplicationsPage({ refugioNombre, manage, currentUserId }) {
  const {
    applications,
    isLoading,
    error,
    viewMode,
    setViewMode,
    approve,
    reject,
    isMutating,
    pendingCount,
  } = manage

  return (
    <section className="space-y-6" aria-labelledby="solicitudes-recibidas">
      <div className="flex flex-wrap items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Inbox className="w-6 h-6" aria-hidden />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="solicitudes-recibidas" className="font-heading text-2xl text-gray-900">
              Solicitudes recibidas
            </h2>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-primary text-white text-xs font-semibold">
                {pendingCount}
              </span>
            )}
          </div>
          {refugioNombre && (
            <p className="text-sm text-gray-600">Refugio: {refugioNombre}</p>
          )}
        </div>
      </div>

      <RefugeApplicationsDashboard
        applications={applications}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
        setViewMode={setViewMode}
        approve={approve}
        reject={reject}
        currentUserId={currentUserId}
        isMutating={isMutating}
      />
    </section>
  )
}
