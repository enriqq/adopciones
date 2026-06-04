import { CheckCircle, XCircle } from 'lucide-react'

const COLUMNS = [
  { key: 'pending', title: 'Pendientes', accent: 'border-amber-300 bg-amber-50/50' },
  { key: 'approved', title: 'Aprobadas', accent: 'border-secondary/40 bg-secondary/5' },
  { key: 'rejected', title: 'Rechazadas', accent: 'border-red-200 bg-red-50/40' },
]

/**
 * @param {{
 *   applications: object[],
 *   onSelect: (app: object) => void,
 *   onApprove: (id: string) => void,
 *   onReject: (id: string) => void,
 *   isMutating: boolean,
 * }} props
 */
export default function ApplicationKanban({
  applications,
  onSelect,
  onApprove,
  onReject,
  isMutating,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const items = applications.filter((a) => a.status === col.key)
        return (
          <div
            key={col.key}
            className={`rounded-xl border ${col.accent} p-3 min-h-[200px] space-y-3`}
          >
            <h3 className="font-heading text-sm font-semibold text-gray-800 px-1">
              {col.title}
              <span className="ml-2 text-xs font-normal text-gray-500">({items.length})</span>
            </h3>
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 px-1 py-4 text-center">Sin solicitudes</p>
            ) : (
              items.map((app) => (
                <article
                  key={app.id}
                  className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 space-y-2 cursor-pointer hover:border-primary/30 transition"
                  onClick={() => onSelect(app)}
                >
                  <div className="flex gap-2">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {app.pet_foto ? (
                        <img src={app.pet_foto} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{app.pet_nombre}</p>
                      <p className="text-xs text-gray-600 truncate">{app.applicant_nombre}</p>
                    </div>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => onApprove(app.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-secondary hover:bg-secondary/10 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" aria-hidden />
                        Aceptar
                      </button>
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => onReject(app.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" aria-hidden />
                        Rechazar
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
