import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  RefreshCcw,
  XCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'
import {
  approveShelterRequest,
  fetchAllShelterRequests,
  mapShelterRequestError,
  rejectShelterRequest,
} from '../../services/shelterRequestService.js'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-secondary/15 text-secondary border-secondary/20',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const REQUEST_ACCENTS = {
  pending: 'border-l-amber-400',
  approved: 'border-l-secondary',
  rejected: 'border-l-red-300',
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function ShelterRequestsAdminPanel() {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState(null)

  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const rows = await fetchAllShelterRequests()
      setRequests(rows)
    } catch (err) {
      setRequests([])
      setError(mapShelterRequestError(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => request.status === 'pending').length,
      approved: requests.filter((request) => request.status === 'approved').length,
      rejected: requests.filter((request) => request.status === 'rejected').length,
    }),
    [requests],
  )

  const handleApprove = async (request) => {
    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: '¿Aprobar solicitud de refugio?',
      html: `<p class="text-sm text-gray-600">Se creará o actualizará el refugio activo para <strong>${request.nombre_refugio}</strong>.</p>`,
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#81B29A',
      cancelButtonColor: '#6b7280',
    })

    if (!isConfirmed) return

    setIsMutating(true)
    try {
      await approveShelterRequest(request.id)
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud aprobada',
        text: 'El usuario ya puede acceder como refugio.',
        confirmButtonColor: '#81B29A',
      })
      await loadRequests()
    } catch (err) {
      const message = mapShelterRequestError(err)
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo aprobar',
        text: message,
        confirmButtonColor: '#E07A5F',
      })
      setError(message)
    } finally {
      setIsMutating(false)
    }
  }

  const handleReject = async (request) => {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: '¿Rechazar solicitud de refugio?',
      text: `La solicitud de ${request.nombre_refugio} quedará rechazada.`,
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#E07A5F',
      cancelButtonColor: '#6b7280',
    })

    if (!isConfirmed) return

    setIsMutating(true)
    try {
      await rejectShelterRequest(request.id)
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud rechazada',
        text: 'La solicitud fue actualizada correctamente.',
        confirmButtonColor: '#81B29A',
      })
      await loadRequests()
    } catch (err) {
      const message = mapShelterRequestError(err)
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo rechazar',
        text: message,
        confirmButtonColor: '#E07A5F',
      })
      setError(message)
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="shelter-requests-admin-heading">
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-sm backdrop-blur">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-secondary/15 to-transparent lg:block" />
        <div className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-900/10">
              <Building2 className="w-7 h-7" aria-hidden />
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                Gestión administrativa
              </div>
              <div className="space-y-2">
                <h2 id="shelter-requests-admin-heading" className="font-heading text-3xl text-gray-900 md:text-4xl">
                  Solicitudes de refugio
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-gray-600 font-body md:text-base">
                  Administra las solicitudes enviadas por usuarios que quieren activar un refugio.
                  Aprueba las cuentas válidas o rechaza las que no cumplan con los requisitos.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {counts.total} total
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {counts.pending} pendientes
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  {counts.approved + counts.rejected} resueltas
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <button
              type="button"
              onClick={() => void loadRequests()}
              disabled={isLoading || isMutating}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-gray-900/10 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCcw className="w-4 h-4" aria-hidden />
              )}
              Actualizar
            </button>
            <p className="text-xs text-gray-500 font-body sm:text-right">
              Revisa el estado de cada solicitud antes de abrir el panel de refugio.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total</p>
            <Building2 className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <p className="mt-3 font-heading text-3xl text-gray-900">{counts.total}</p>
          <p className="mt-1 text-xs text-gray-500 font-body">Solicitudes registradas en el sistema</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Pendientes</p>
            <Clock3 className="w-4 h-4 text-amber-700" aria-hidden />
          </div>
          <p className="mt-3 font-heading text-3xl text-amber-900">{counts.pending}</p>
          <p className="mt-1 text-xs text-amber-700/80 font-body">Casos que aún requieren revisión</p>
        </div>

        <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-secondary">Resueltas</p>
            <CheckCircle className="w-4 h-4 text-secondary" aria-hidden />
          </div>
          <p className="mt-3 font-heading text-3xl text-gray-900">
            {counts.approved + counts.rejected}
          </p>
          <p className="mt-1 text-xs text-gray-600 font-body">Aprobadas o rechazadas</p>
        </div>
      </div>

      {error && !isLoading && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse"
            >
              <div className="h-5 w-44 rounded bg-gray-200" />
              <div className="mt-4 h-4 w-2/3 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
              <div className="mt-6 h-10 w-full rounded-2xl bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && requests.length === 0 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="w-7 h-7" aria-hidden />
          </div>
          <p className="mt-4 font-heading text-lg text-gray-900">Sin solicitudes</p>
          <p className="mt-2 text-sm text-gray-600 font-body">
            Cuando lleguen solicitudes nuevas para activar un refugio, aparecerán aquí.
          </p>
        </div>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => {
            const isPending = request.status === 'pending'
            const accentClass = REQUEST_ACCENTS[request.status] ?? REQUEST_ACCENTS.pending

            return (
              <article
                key={request.id}
                className={`overflow-hidden rounded-3xl border border-gray-100 border-l-4 bg-white/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${accentClass}`}
              >
                <div className="p-5 md:p-6 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-2xl text-gray-900 truncate">
                          {request.nombre_refugio}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[request.status] ?? STATUS_STYLES.pending}`}
                        >
                          {STATUS_LABELS[request.status] ?? request.status}
                        </span>
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-gray-600 font-body">
                        Solicitud enviada por un usuario que quiere activar un refugio en la plataforma.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-right shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Solicitada el
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(request.created_at)}</p>
                      {request.reviewed_at && (
                        <p className="mt-2 text-[11px] text-gray-500">
                          Revisada el {formatDate(request.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Dirección
                      </p>
                      <div className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                        <MapPin className="mt-0.5 w-4 h-4 shrink-0 text-primary" aria-hidden />
                        <span className="leading-6">{request.direccion}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Teléfono
                      </p>
                      <div className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                        <Phone className="mt-0.5 w-4 h-4 shrink-0 text-secondary" aria-hidden />
                        <span className="leading-6">{request.telefono}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500 font-body">
                      Usuario: <span className="break-all text-gray-700">{request.user_id}</span>
                    </p>

                    {isPending ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => void handleApprove(request)}
                          className="inline-flex items-center gap-2 rounded-xl border border-secondary/25 bg-secondary/10 px-4 py-2.5 text-sm font-medium text-secondary transition hover:bg-secondary/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" aria-hidden />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => void handleReject(request)}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" aria-hidden />
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 font-body">
                        La solicitud ya fue procesada.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}