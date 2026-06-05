import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ClipboardList,
  Inbox,
  Loader2,
  LogOut,
  Shield,
  User,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import ShelterRequestForm from '../components/profile/ShelterRequestForm.jsx'

const ROLE_LABELS = {
  user: 'Adoptante',
  shelter: 'Refugio',
  admin: 'Administrador',
}

const ROLE_STYLES = {
  user: 'bg-secondary/15 text-secondary border-secondary/30',
  shelter: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-gray-900 text-white border-gray-800',
}

/**
 * @param {{
 *   session: object,
 *   profile: object | null,
 *   systemRole: string | null,
 *   isLoadingProfile?: boolean,
 *   onSignOut: () => void,
 *   onGoToApplications?: () => void,
 *   showShelterDashboard?: boolean,
 *   pendingShelterApps?: number,
 * }} props
 */
export default function ProfilePage({
  session,
  profile,
  systemRole,
  isLoadingProfile = false,
  onSignOut,
  onGoToApplications,
  showShelterDashboard = false,
  pendingShelterApps = 0,
}) {
  const [signingOut, setSigningOut] = useState(false)
  const userId = session.user.id
  const role = systemRole ?? 'user'
  const isAdmin = role === 'admin'
  const isShelter = role === 'shelter'

  const handleSignOut = async () => {
    if (!supabase) return
    setSigningOut(true)
    await supabase.auth.signOut()
    setSigningOut(false)
    onSignOut()
  }

  return (
    <section className="max-w-2xl mx-auto space-y-6" aria-labelledby="mi-perfil-heading">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <User className="w-6 h-6" aria-hidden />
        </div>
        <div>
          <h2 id="mi-perfil-heading" className="font-heading text-2xl text-gray-900">
            Mi perfil
          </h2>
          <p className="text-sm text-gray-600 font-body">Cuenta y configuración de sesión</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
        {isLoadingProfile ? (
          <p className="text-sm text-gray-500 font-body flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Cargando perfil…
          </p>
        ) : (
          <>
            <dl className="space-y-3 text-sm font-body">
              <div>
                <dt className="text-gray-500">Correo</dt>
                <dd className="font-medium text-gray-900">{session.user.email}</dd>
              </div>
              {profile?.display_name && (
                <div>
                  <dt className="text-gray-500">Nombre</dt>
                  <dd className="font-medium text-gray-900">{profile.display_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 mb-1">Rol</dt>
                <dd>
                  <span
                    className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${
                      ROLE_STYLES[role] ?? ROLE_STYLES.user
                    }`}
                  >
                    {ROLE_LABELS[role] ?? role}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition font-body"
                >
                  <Shield className="w-4 h-4" aria-hidden />
                  Panel admin
                </Link>
              )}
              {showShelterDashboard && (
                <Link
                  to="/shelter-dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-white hover:bg-secondary/90 transition font-body"
                >
                  <Inbox className="w-4 h-4" aria-hidden />
                  Panel refugio
                  {pendingShelterApps > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/20 text-xs font-semibold">
                      {pendingShelterApps}
                    </span>
                  )}
                </Link>
              )}
              {onGoToApplications && (role === 'user' || role === 'shelter') && (
                <button
                  type="button"
                  onClick={onGoToApplications}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-body"
                >
                  <ClipboardList className="w-4 h-4" aria-hidden />
                  Mis adopciones
                </button>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium font-body hover:bg-primary/90 transition disabled:opacity-50"
        >
          {signingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          ) : (
            <LogOut className="w-5 h-5" aria-hidden />
          )}
          {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>

      {role === 'user' && (
        <ShelterRequestForm userId={userId} systemRole={role} />
      )}

      {isShelter && !showShelterDashboard && (
        <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-body flex items-start gap-2">
          <Building2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          Tu rol es refugio pero aún no hay un refugio vinculado. Contacta al administrador si
          acabas de ser aprobado.
        </p>
      )}
    </section>
  )
}
