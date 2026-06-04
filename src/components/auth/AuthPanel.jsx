import { useState } from 'react'
import Swal from 'sweetalert2'
import { Heart, Loader2, LogIn, LogOut, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { mapSupabaseError } from '../../services/petService.js'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none'

/**
 * @param {{ session: object | null, onAuthChange: () => void }} props
 */
export default function AuthPanel({ session, onAuthChange }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [refugioNombre, setRefugioNombre] = useState('Mi refugio')
  const [ciudad, setCiudad] = useState('')
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')

  if (!supabase) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm">
        Configura <code className="font-mono text-xs">VITE_SUPABASE_URL</code> y{' '}
        <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> en{' '}
        <code className="font-mono text-xs">.env.local</code> (copia desde{' '}
        <code className="font-mono text-xs">.env.example</code>).
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
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        if (data.user && refugioNombre.trim().length >= 2) {
          await supabase.from('refugios').insert({
            user_id: data.user.id,
            nombre: refugioNombre.trim(),
            ciudad: ciudad.trim() || 'Sin especificar',
            estado: estado.trim() || 'Sin especificar',
          })
        }

        await Swal.fire({
          icon: 'info',
          title: 'Cuenta creada',
          text: 'Si el proyecto requiere confirmación por correo, revisa tu bandeja antes de iniciar sesión.',
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
        <p className="text-sm text-gray-700 truncate">
          Sesión: <span className="font-medium">{session.user.email}</span>
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
      <div className="flex items-center gap-2 text-primary">
        <Heart className="w-6 h-6" aria-hidden />
        <h2 className="font-heading text-xl text-gray-900">Acceso refugio</h2>
      </div>

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
              <label htmlFor="refugioNombre" className="text-sm font-medium text-gray-700">
                Nombre del refugio
              </label>
              <input
                id="refugioNombre"
                type="text"
                className={inputClass}
                value={refugioNombre}
                onChange={(e) => setRefugioNombre(e.target.value)}
                minLength={2}
                required
              />
            </div>
            <div>
              <label htmlFor="ciudad" className="text-sm font-medium text-gray-700">
                Ciudad
              </label>
              <input
                id="ciudad"
                type="text"
                className={inputClass}
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="ej. Aguascalientes"
                minLength={2}
              />
            </div>
            <div>
              <label htmlFor="estado" className="text-sm font-medium text-gray-700">
                Estado / región
              </label>
              <input
                id="estado"
                type="text"
                className={inputClass}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                placeholder="ej. Aguascalientes"
                minLength={2}
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Correo
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
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
          className="w-full flex items-center justify-center gap-2 bg-secondary hover:opacity-90 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition"
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
