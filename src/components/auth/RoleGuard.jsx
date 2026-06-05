import { Link, Navigate, Outlet } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile.js'

/**
 * @param {{ allowedRoles: string[] }} props
 */
export function RoleGuard({ allowedRoles }) {
  const { session, systemRole, isLoading, error, refetch } = useProfile(null)

  if (isLoading) {
    return (
      <p className="text-sm text-gray-500 p-6 font-body">Verificando permisos…</p>
    )
  }

  if (!session?.user) {
    return <Navigate to="/" replace state={{ authRequired: true }} />
  }

  if (!systemRole || !allowedRoles.includes(systemRole)) {
    return (
      <div className="min-h-svh flex items-center justify-center p-6 bg-gradient-to-b from-orange-50/80 via-white to-green-50/50">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-primary" aria-hidden />
          <h2 className="font-heading text-lg text-gray-900">Acceso denegado</h2>
          <p className="text-sm text-gray-600 font-body">
            Tu cuenta tiene rol{' '}
            <strong className="capitalize">{systemRole ?? 'desconocido'}</strong>. Se requiere:{' '}
            {allowedRoles.join(' o ')}.
          </p>
          {error && (
            <p className="text-xs text-primary bg-orange-50/80 rounded-lg px-3 py-2 font-body">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => void refetch()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-white hover:bg-secondary/90 font-body"
            >
              Reintentar
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 font-body"
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
 * HOC para envolver un componente con RoleGuard.
 * @param {React.ComponentType<object>} Component
 * @param {string[]} allowedRoles
 */
export function withRoleGuard(Component, allowedRoles) {
  return function GuardedComponent(props) {
    const { session, systemRole, isLoading } = useProfile(null)

    if (isLoading) {
      return (
        <p className="text-sm text-gray-500 p-6 font-body">Verificando permisos…</p>
      )
    }

    if (!session?.user || !systemRole || !allowedRoles.includes(systemRole)) {
      return <Navigate to="/" replace state={{ forbidden: true }} />
    }

    return <Component {...props} />
  }
}
