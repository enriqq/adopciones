import { useState } from 'react'
import Swal from 'sweetalert2'
import { Heart, Loader2, LogIn, LogOut, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { ensureApplicantProfile } from '../../services/adoptionApplicationService.js'
import { mapSupabaseError } from '../../services/petService.js'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none'

/**
 * @param {{
 *   session: object | null,
 *   onAuthChange: () => void,
 *   compact?: boolean,
 * }} props
 */
export default function ApplicantAuthPanel({ session, onAuthChange, compact = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')

  if (!supabase) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm">
        Configura Supabase en <code className="font-mono text-xs">.env.local</code>.
      </div>
    )
  }

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    onAuthChange()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        if (nombre.trim().length < 2) {
          throw new Error('Indica tu nombre (mínimo 2 caracteres).')
        }

        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        if (data.user) {
          await ensureApplicantProfile(data.user.id, {
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            email: email.trim(),
          })
        }

        await Swal.fire({
          icon: 'info',
          title: 'Cuenta de adoptante creada',
          text: 'Si el proyecto requiere confirmación por correo, revísala antes de iniciar sesión.',
          confirmButtonColor: '#81B29A',
        })
      }
      onAuthChange()
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Autenticación',
        text: mapSupabaseError(err),
        confirmButtonColor: '#E07A5F',
      })
    } finally {
      setLoading(false)
    }
  }

  if (session?.user) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm ${
          compact ? '' : ''
        }`}
      >
        <p className="text-sm text-gray-700 truncate">
          Adoptante: <span className="font-medium">{session.user.email}</span>
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 space-y-4">
      <div className="flex items-center gap-2 text-secondary">
        <Heart className="w-6 h-6" aria-hidden />
        <h2 className="font-heading text-xl text-gray-900">Cuenta adoptante</h2>
      </div>
      <p className="text-sm text-gray-600">
        Regístrate o inicia sesión para enviar solicitudes de adopción.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'login'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'register'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && (
          <>
            <div>
              <label htmlFor="applicant-nombre" className="text-sm font-medium text-gray-700">
                Nombre completo *
              </label>
              <input
                id="applicant-nombre"
                type="text"
                className={inputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                minLength={2}
                required
              />
            </div>
            <div>
              <label htmlFor="applicant-telefono" className="text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="applicant-telefono"
                type="tel"
                className={inputClass}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="applicant-email" className="text-sm font-medium text-gray-700">
            Correo
          </label>
          <input
            id="applicant-email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="applicant-password" className="text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="applicant-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : mode === 'login' ? (
            <>
              <LogIn className="w-5 h-5" />
              Entrar
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Crear cuenta adoptante
            </>
          )}
        </button>
      </form>
    </div>
  )
}
