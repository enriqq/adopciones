import { useEffect } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile.js'

export function RequireAdmin() {
  const { isAdmin, isLoading, session, error, refetch, systemRole } =
    useProfile(null)

  useEffect(() => {
    if (session?.user?.id) {
      void refetch()
    }
  }, [session?.user?.id, refetch])

  if (isLoading) {
    return (
      <p className="text-sm text-gray-500 p-6 font-body">
        Verificando permisos…
      </p>
    )
  }

  if (!session) {
    return <Navigate to="/" replace state={{ authRequired: true }} />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-svh flex items-center justify-center p-6 bg-gradient-to-b from-orange-50/80 via-white to-green-50/50">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 text-center">
          <h2 className="font-heading text-lg text-gray-900">
            Acceso de administrador requerido
          </h2>
          <p className="text-sm text-gray-600">
            Tu sesión está activa pero el perfil indica rol{' '}
            <strong className="capitalize">{systemRole ?? 'desconocido'}</strong>
            , no <strong>admin</strong>.
          </p>
          {error && (
            <p className="text-xs text-primary bg-orange-50/80 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Si acabas de promover tu usuario en Supabase, pulsa Reintentar o
            cierra sesión y vuelve a entrar con el mismo correo.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => void refetch()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-white hover:bg-secondary/90"
            >
              Reintentar
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}

/**
 * HOC: envuelve un componente con la misma guardia que RequireAdmin.
 * @param {React.ComponentType<object>} Component
 */
export function withRequireAdmin(Component) {
  return function AdminGuarded(props) {
    const { isAdmin, isLoading, session } = useProfile(null)

    if (isLoading) {
      return (
        <p className="text-sm text-gray-500 p-6 font-body">
          Verificando permisos…
        </p>
      )
    }

    if (!session || !isAdmin) {
      return <Navigate to="/" replace state={{ forbidden: true }} />
    }

    return <Component {...props} />
  }
}
