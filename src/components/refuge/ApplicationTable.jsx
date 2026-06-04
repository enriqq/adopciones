import { CheckCircle, Mail, Phone, XCircle } from 'lucide-react'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-secondary/15 text-secondary',
  rejected: 'bg-red-50 text-red-700',
}

/**
 * @param {{
 *   applications: import('../../services/refugeApplicationService.js').normalizeRefugeApplicationRow extends (row: infer R) => infer T ? T[] : never,
 *   onSelect: (app: object) => void,
 *   onApprove: (id: string) => void,
 *   onReject: (id: string) => void,
 *   isMutating: boolean,
 * }} props
 */
export default function ApplicationTable({
  applications,
  onSelect,
  onApprove,
  onReject,
  isMutating,
}) {
  if (applications.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 py-12 bg-white rounded-xl border border-gray-100">
        No hay solicitudes de adopción todavía.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 font-medium">
          <tr>
            <th className="px-4 py-3">Mascota</th>
            <th className="px-4 py-3">Solicitante</th>
            <th className="px-4 py-3 hidden md:table-cell">Email</th>
            <th className="px-4 py-3 hidden lg:table-cell">Teléfono</th>
            <th className="px-4 py-3 hidden sm:table-cell">Fecha</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {applications.map((app) => (
            <tr
              key={app.id}
              className="hover:bg-orange-50/40 cursor-pointer transition"
              onClick={() => onSelect(app)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {app.pet_foto ? (
                      <img src={app.pet_foto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        —
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{app.pet_nombre}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {app.pet_especie} · {app.pet_raza}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-800">{app.applicant_nombre}</td>
              <td className="px-4 py-3 hidden md:table-cell">
                {app.applicant_email ? (
                  <a
                    href={`mailto:${app.applicant_email}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden />
                    {app.applicant_email}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                {app.applicant_telefono ? (
                  <a
                    href={`tel:${app.applicant_telefono}`}
                    className="inline-flex items-center gap-1 text-secondary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden />
                    {app.applicant_telefono}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-gray-500 whitespace-nowrap">
                {new Date(app.created_at).toLocaleDateString('es-MX')}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    STATUS_STYLES[app.status] ?? STATUS_STYLES.pending
                  }`}
                >
                  {STATUS_LABELS[app.status] ?? app.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {app.status === 'pending' ? (
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => onApprove(app.id)}
                      className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition disabled:opacity-50"
                      title="Aceptar solicitud"
                      aria-label={`Aceptar solicitud de ${app.applicant_nombre}`}
                    >
                      <CheckCircle className="w-5 h-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => onReject(app.id)}
                      className="p-2 rounded-lg text-primary hover:bg-primary/10 transition disabled:opacity-50"
                      title="Rechazar solicitud"
                      aria-label={`Rechazar solicitud de ${app.applicant_nombre}`}
                    >
                      <XCircle className="w-5 h-5" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 text-right block">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
