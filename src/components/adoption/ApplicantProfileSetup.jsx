import { useState } from 'react'
import { AlertCircle, Loader2, User } from 'lucide-react'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none'

/**
 * @param {{
 *   defaultNombre?: string,
 *   onSubmit: (profile: { nombre: string, telefono: string }) => Promise<void>,
 *   onCancel: () => void,
 * }} props
 */
export default function ApplicantProfileSetup({ defaultNombre = '', onSubmit, onCancel }) {
  const [nombre, setNombre] = useState(defaultNombre)
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (nombre.trim().length < 2) {
      setError('Indica tu nombre (mínimo 2 caracteres).')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onSubmit({ nombre: nombre.trim(), telefono: telefono.trim() })
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar el perfil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-primary" aria-hidden />
        <h2 className="font-heading text-xl text-gray-900">Completa tu perfil</h2>
      </div>
      <p className="text-sm text-gray-600">
        Necesitamos tu nombre para asociar la solicitud de adopción.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="setup-nombre" className="text-sm font-medium text-gray-700">
            Nombre completo *
          </label>
          <input
            id="setup-nombre"
            type="text"
            className={inputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <label htmlFor="setup-telefono" className="text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            id="setup-telefono"
            type="tel"
            className={inputClass}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-red-600 text-xs flex items-center gap-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden />
            {error}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  )
}
