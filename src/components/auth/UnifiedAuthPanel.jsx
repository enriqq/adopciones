import { useState } from 'react'
import Swal from 'sweetalert2'
import { Loader2, LogIn, LogOut, PawPrint, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { ensureApplicantProfile } from '../../services/adoptionApplicationService.js'
import { ensureProfile } from '../../services/profileService.js'
import { mapSupabaseError } from '../../services/petService.js'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 font-body focus:ring-2 focus:ring-primary focus:border-primary outline-none'

/**
 * Registro e inicio de sesión unificados. Rol por defecto: user (profiles + trigger BD).
 *
 * @param {{
 *   session: object | null,
 *   onAuthChange: () => void,
 *   compact?: boolean,
 * }} props
 */
export default function UnifiedAuthPanel({ session, onAuthChange, compact = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')

  if (!supabase) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm font-body">
        Configura <code className="font-mono text-xs">VITE_SUPABASE_URL</code> y{' '}
        <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> en{' '}
        <code className="font-mono text-xs">.env.local</code>.
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        if (data.user) {
          await ensureProfile(data.user.id, {
            email: data.user.email,
            displayName: data.user.user_metadata?.display_name ?? data.user.email?.split('@')[0],
          })
        }
      } else {
        if (nombre.trim().length < 2) {
          throw new Error('Indica tu nombre (mínimo 2 caracteres).')
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: nombre.trim(),
              nombre: nombre.trim(),
            },
          },
        })
        if (error) throw error

        if (data.user) {
          await ensureProfile(data.user.id, {
            email: email.trim(),
            displayName: nombre.trim(),
          })

          await ensureApplicantProfile(data.user.id, {
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            email: email.trim(),
          })
        }

        await Swal.fire({
          icon: 'success',
          title: 'Cuenta creada',
          text: 'Tu perfil se registró como adoptante. Si el proyecto requiere confirmación por correo, revísala antes de iniciar sesión.',
          confirmButtonColor: '#E07A5F',
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
        <p className="text-sm text-gray-700 truncate font-body">
          Sesión: <span className="font-medium">{session.user.email}</span>
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition font-body"
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
      <div className="flex items-center gap-2 text-primary">
        <PawPrint className="w-6 h-6" aria-hidden />
        <h2 className="font-heading text-xl text-gray-900">
          {compact ? 'Acceso' : 'Cuenta de adoptante'}
        </h2>
      </div>
      <p className="text-sm text-gray-600 font-body">
        Un solo registro para explorar, solicitar adopciones y gestionar tu perfil. El rol de refugio
        se solicita por separado una vez dentro de la app.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium font-body transition ${
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
          className={`flex-1 py-2 rounded-lg text-sm font-medium font-body transition ${
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
              <label htmlFor="auth-nombre" className="text-sm font-medium text-gray-700 font-body">
                Nombre completo *
              </label>
              <input
                id="auth-nombre"
                type="text"
                className={inputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                minLength={2}
                required
              />
            </div>
            <div>
              <label htmlFor="auth-telefono" className="text-sm font-medium text-gray-700 font-body">
                Teléfono
              </label>
              <input
                id="auth-telefono"
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
          <label htmlFor="auth-email" className="text-sm font-medium text-gray-700 font-body">
            Correo
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="text-sm font-medium text-gray-700 font-body">
            Contraseña
          </label>
          <input
            id="auth-password"
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
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition font-body"
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
              Crear cuenta
            </>
          )}
        </button>
      </form>
    </div>
  )
}
