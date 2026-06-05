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
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-secondary/15 text-secondary border-secondary/30',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 font-body focus:ring-2 focus:ring-primary focus:border-primary outline-none'

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
      <section className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-secondary" aria-hidden />
          <h3 className="font-heading text-lg text-gray-900">Cuenta de refugio activa</h3>
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
      className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
      aria-labelledby="shelter-request-heading"
    >
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" aria-hidden />
        <h3 id="shelter-request-heading" className="font-heading text-lg text-gray-900">
          Solicitar cuenta de refugio
        </h3>
      </div>
      <p className="text-sm text-gray-600 font-body">
        Si representas un refugio o albergue, envía tu solicitud. Un administrador la revisará antes
        de habilitar tu panel de gestión.
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-500 font-body animate-pulse">Cargando solicitudes…</p>
      ) : (
        requests.length > 0 && (
          <ul className="space-y-2">
            {requests.slice(0, 3).map((req) => (
              <li
                key={req.id}
                className={`text-sm rounded-lg border px-3 py-2 font-body ${STATUS_STYLES[req.status] ?? STATUS_STYLES.pending}`}
              >
                <span className="font-medium">{req.nombre_refugio}</span>
                {' · '}
                {STATUS_LABELS[req.status] ?? req.status}
                <span className="block text-xs opacity-80 mt-0.5">{req.direccion}</span>
              </li>
            ))}
          </ul>
        )
      )}

      {pendingRequest ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-body">
          Ya tienes una solicitud pendiente para <strong>{pendingRequest.nombre_refugio}</strong>.
          Espera la respuesta del equipo antes de enviar otra.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
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
            <p className="text-xs text-red-700 font-body" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium font-body hover:bg-primary/90 transition disabled:opacity-50"
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
