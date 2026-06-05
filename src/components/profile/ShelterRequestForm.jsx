import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { Building2, Loader2, Send } from 'lucide-react'
import {
  fetchMyShelterRequests,
  mapShelterRequestError,
  submitShelterRequest,
} from '../../services/shelterRequestService.js'

const STATUS_LABELS = {
  pending: 'Pendiente de revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-secondary/10 text-secondary border-secondary/20',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 font-body text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'

/**
 * @param {{ userId: string, systemRole?: string | null }} props
 */
export default function ShelterRequestForm({ userId, systemRole = 'user' }) {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nombreRefugio, setNombreRefugio] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [formError, setFormError] = useState(null)

  const pendingRequest = requests.find((r) => r.status === 'pending')
  const isShelter = systemRole === 'shelter' || systemRole === 'admin'

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      try {
        const rows = await fetchMyShelterRequests(userId)
        if (!cancelled) setRequests(rows)
      } catch {
        if (!cancelled) setRequests([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (nombreRefugio.trim().length < 2) {
      setFormError('Indica el nombre del refugio (mínimo 2 caracteres).')
      return
    }
    if (direccion.trim().length < 5) {
      setFormError('Indica una dirección válida.')
      return
    }
    if (telefono.trim().length < 8) {
      setFormError('Indica un teléfono de contacto válido.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await submitShelterRequest({
        nombre_refugio: nombreRefugio,
        direccion,
        telefono,
      })
      setRequests((prev) => [created, ...prev])
      setNombreRefugio('')
      setDireccion('')
      setTelefono('')

      await Swal.fire({
        icon: 'success',
        title: 'Solicitud enviada',
        text: 'Revisaremos tu solicitud de cuenta de refugio. Te notificaremos cuando sea aprobada.',
        confirmButtonColor: '#E07A5F',
      })
    } catch (err) {
      const message = mapShelterRequestError(err)
      setFormError(message)
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar',
        text: message,
        confirmButtonColor: '#E07A5F',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isShelter) {
    return (
      <section className="rounded-3xl border border-secondary/20 bg-gradient-to-br from-secondary/10 via-white to-green-50/60 p-6 space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary shadow-sm">
            <Building2 className="w-5 h-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary shadow-sm">
              Refugio activo
            </p>
            <h3 className="font-heading text-lg text-gray-900">Cuenta de refugio activa</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-body">
          Tu perfil ya tiene permisos de refugio. Accede al panel de solicitudes recibidas desde el
          menú principal.
        </p>
      </section>
    )
  }

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/90 p-6 space-y-5 shadow-sm"
      aria-labelledby="shelter-request-heading"
    >
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-sm shadow-primary/20">
          <Building2 className="w-5 h-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Solicitud de acceso
          </p>
          <h3 id="shelter-request-heading" className="font-heading text-2xl text-gray-900">
            Solicitar cuenta de refugio
          </h3>
        </div>
      </div>
      <p className="relative max-w-2xl text-sm leading-6 text-gray-600 font-body">
        Si representas un refugio o albergue, envía tu solicitud. Un administrador la revisará antes
        de habilitar tu panel de gestión.
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-500 font-body animate-pulse">Cargando solicitudes…</p>
      ) : (
        requests.length > 0 && (
          <ul className="relative grid gap-3">
            {requests.slice(0, 3).map((req) => (
              <li
                key={req.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 font-body">{req.nombre_refugio}</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[req.status] ?? STATUS_STYLES.pending}`}
                      >
                        {STATUS_LABELS[req.status] ?? req.status}
                      </span>
                    </div>
                    <p className="text-xs leading-5 text-gray-600 font-body">{req.direccion}</p>
                  </div>
                  <Building2 className="mt-0.5 w-4 h-4 shrink-0 text-primary" aria-hidden />
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {pendingRequest ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <p className="font-medium font-body">
            Ya tienes una solicitud pendiente para <strong>{pendingRequest.nombre_refugio}</strong>.
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800 font-body">
            Espera la respuesta del equipo antes de enviar otra solicitud.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative grid gap-4 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm md:p-5">
          <div>
            <label htmlFor="sr-nombre" className="text-sm font-medium text-gray-700 font-body">
              Nombre del refugio *
            </label>
            <input
              id="sr-nombre"
              type="text"
              className={inputClass}
              value={nombreRefugio}
              onChange={(e) => setNombreRefugio(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div>
            <label htmlFor="sr-direccion" className="text-sm font-medium text-gray-700 font-body">
              Dirección *
            </label>
            <input
              id="sr-direccion"
              type="text"
              className={inputClass}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número, ciudad, estado"
              required
              minLength={5}
            />
          </div>
          <div>
            <label htmlFor="sr-telefono" className="text-sm font-medium text-gray-700 font-body">
              Teléfono de contacto *
            </label>
            <input
              id="sr-telefono"
              type="tel"
              className={inputClass}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-700 font-body" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Send className="w-4 h-4" aria-hidden />
            )}
            {isSubmitting ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      )}
    </section>
  )
}
