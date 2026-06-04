import { CheckCircle, Mail, Phone, X, XCircle } from 'lucide-react'
import ApplicationMessageThread from './ApplicationMessageThread.jsx'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

/**
 * @param {{
 *   application: object | null,
 *   onClose: () => void,
 *   onApprove: (id: string) => void,
 *   onReject: (id: string) => void,
 *   onSendMessage: (applicationId: string, body: string) => Promise<void>,
 *   isMutating: boolean,
 * }} props
 */
export default function ApplicationDetailDrawer({
  application,
  onClose,
  onApprove,
  onReject,
  onSendMessage,
  isMutating,
}) {
  if (!application) return null

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Cerrar detalle"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 id="application-detail-title" className="font-heading text-lg text-gray-900">
            Detalle de solicitud
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
              {application.pet_foto ? (
                <img
                  src={application.pet_foto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="font-heading text-xl text-gray-900">{application.pet_nombre}</p>
              <p className="text-sm text-gray-600 capitalize">
                {application.pet_especie} · {application.pet_raza}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Estado: {STATUS_LABELS[application.status] ?? application.status}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-heading font-semibold text-gray-800">Solicitante</p>
            <p>{application.applicant_nombre}</p>
            {application.applicant_email && (
              <a
                href={`mailto:${application.applicant_email}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Mail className="w-4 h-4" aria-hidden />
                {application.applicant_email}
              </a>
            )}
            {application.applicant_telefono && (
              <a
                href={`tel:${application.applicant_telefono}`}
                className="inline-flex items-center gap-1 text-secondary hover:underline block"
              >
                <Phone className="w-4 h-4" aria-hidden />
                {application.applicant_telefono}
              </a>
            )}
          </div>

          <div className="bg-orange-50/60 rounded-xl p-4 space-y-2 text-sm border border-primary/10">
            <p className="font-heading font-semibold text-gray-800">Datos del hogar</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-gray-500">Vivienda</dt>
                <dd className="capitalize">{application.tipo_vivienda}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Patio</dt>
                <dd>{application.tiene_patio ? 'Sí' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Horas solo</dt>
                <dd>{application.horas_solo} h/día</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Experiencia</dt>
                <dd>{application.experiencia_previa}</dd>
              </div>
              {application.otras_mascotas && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Otras mascotas</dt>
                  <dd>{application.otras_mascotas}</dd>
                </div>
              )}
            </dl>
          </div>

          {application.status === 'pending' && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => onApprove(application.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-secondary border border-secondary/30 hover:bg-secondary/10 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" aria-hidden />
                Aceptar
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => onReject(application.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-primary border border-primary/30 hover:bg-primary/10 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" aria-hidden />
                Rechazar
              </button>
            </div>
          )}

          <ApplicationMessageThread
            applicationId={application.id}
            viewerRole="refugio"
            onSend={onSendMessage}
            isMutating={isMutating}
          />
        </div>
      </aside>
    </div>
  )
}
