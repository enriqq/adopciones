import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Shield, Trash } from 'lucide-react'
import {
  confirmModerationAction,
  showModerationError,
  showModerationSuccess,
} from '../../lib/adminSwal.js'
import { useAdminModeration } from '../../hooks/useAdminModeration.js'

const PET_STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  suspended: 'Suspendida',
}

const ROLE_LABELS = {
  user: 'Adoptante',
  shelter: 'Refugio',
  admin: 'Administrador',
}

/**
 * @param {{ defaultTab?: 'pets' | 'users' }} props
 */
export default function AdminDashboard({ defaultTab = 'pets' }) {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = useMemo(() => {
    if (location.pathname.includes('/admin/users')) return 'users'
    if (location.pathname.includes('/admin/pets')) return 'pets'
    return defaultTab
  }, [location.pathname, defaultTab])

  const moderation = useAdminModeration({ enabled: true })
  const {
    pets,
    users,
    petFilters,
    setPetFilters,
    userFilters,
    setUserFilters,
    isLoadingPets,
    isLoadingUsers,
    isMutating,
    error,
    approvePet,
    suspendPet,
    deletePet,
    suspendUser,
    unsuspendUser,
    deleteUser,
  } = moderation

  const [localPetSearch, setLocalPetSearch] = useState(petFilters.search)
  const [localUserSearch, setLocalUserSearch] = useState(userFilters.search)

  useEffect(() => {
    const t = setTimeout(() => {
      setPetFilters((prev) => ({ ...prev, search: localPetSearch }))
    }, 300)
    return () => clearTimeout(t)
  }, [localPetSearch, setPetFilters])

  useEffect(() => {
    const t = setTimeout(() => {
      setUserFilters((prev) => ({ ...prev, search: localUserSearch }))
    }, 300)
    return () => clearTimeout(t)
  }, [localUserSearch, setUserFilters])

  const setTab = (tab) => {
    navigate(tab === 'users' ? '/admin/users' : '/admin/pets')
  }

  const runWithConfirm = async ({
    title,
    text,
    confirmText,
    destructive,
    action,
  }) => {
    const { confirmed, reason } = await confirmModerationAction({
      title,
      text,
      confirmText,
      destructive,
    })
    if (!confirmed) return
    try {
      await action(reason)
      await showModerationSuccess('Acción registrada correctamente.')
    } catch (err) {
      await showModerationError(err?.message ?? 'No se pudo completar la acción.')
    }
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-orange-50/80 via-white to-green-50/50">
      <header className="border-b border-primary/10 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary text-white">
              <Shield className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h1 className="font-heading text-xl md:text-2xl text-gray-900">
                Admin Panel
              </h1>
              <p className="text-xs md:text-sm text-gray-600">
                Moderación de mascotas y usuarios
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Volver al sitio
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <nav
          className="flex gap-2 border-b border-gray-100"
          aria-label="Secciones de moderación"
        >
          <button
            type="button"
            onClick={() => setTab('pets')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === 'pets'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Mascotas
          </button>
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Usuarios
          </button>
        </nav>

        {error && (
          <p className="text-sm text-primary bg-orange-50/80 border border-primary/10 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {activeTab === 'pets' && (
          <section className="space-y-4" aria-labelledby="admin-pets">
            <div className="flex flex-wrap gap-3">
              <select
                value={petFilters.status}
                onChange={(e) =>
                  setPetFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                aria-label="Filtrar por estado de moderación"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobada</option>
                <option value="suspended">Suspendida</option>
              </select>
              <input
                type="search"
                value={localPetSearch}
                onChange={(e) => setLocalPetSearch(e.target.value)}
                placeholder="Buscar por nombre…"
                className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 font-heading">Nombre</th>
                      <th className="px-4 py-3 font-heading">Especie</th>
                      <th className="px-4 py-3 font-heading">Refugio</th>
                      <th className="px-4 py-3 font-heading">Adopción</th>
                      <th className="px-4 py-3 font-heading">Moderación</th>
                      <th className="px-4 py-3 font-heading text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoadingPets &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-4 py-4 h-10 bg-gray-50" />
                        </tr>
                      ))}
                    {!isLoadingPets && pets.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-gray-500"
                        >
                          No hay registros que coincidan con el filtro.
                        </td>
                      </tr>
                    )}
                    {!isLoadingPets &&
                      pets.map((pet) => (
                        <tr key={pet.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {pet.nombre}
                          </td>
                          <td className="px-4 py-3 capitalize text-gray-600">
                            {pet.especie}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {pet.refugio_nombre}
                          </td>
                          <td className="px-4 py-3 text-gray-600 capitalize">
                            {pet.estado_adopcion}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {PET_STATUS_LABELS[pet.moderation_status] ??
                                pet.moderation_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              {pet.moderation_status !== 'approved' && (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  aria-label="Aprobar"
                                  onClick={() =>
                                    void runWithConfirm({
                                      title: '¿Aprobar mascota?',
                                      text: `La mascota «${pet.nombre}» será visible en el catálogo si está disponible.`,
                                      confirmText: 'Aprobar',
                                      destructive: false,
                                      action: (reason) =>
                                        approvePet(pet.id, reason),
                                    })
                                  }
                                  className="p-2 rounded-lg hover:bg-secondary/10 disabled:opacity-50"
                                >
                                  <CheckCircle
                                    className="w-4 h-4 text-secondary"
                                    aria-hidden
                                  />
                                </button>
                              )}
                              {pet.moderation_status !== 'suspended' && (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  aria-label="Suspender"
                                  onClick={() =>
                                    void runWithConfirm({
                                      title: '¿Suspender mascota?',
                                      text: `«${pet.nombre}» dejará de mostrarse en el catálogo.`,
                                      confirmText: 'Suspender',
                                      destructive: true,
                                      action: (reason) =>
                                        suspendPet(pet.id, reason),
                                    })
                                  }
                                  className="p-2 rounded-lg hover:bg-primary/10 disabled:opacity-50"
                                >
                                  <Shield
                                    className="w-4 h-4 text-primary"
                                    aria-hidden
                                  />
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isMutating}
                                aria-label="Eliminar"
                                onClick={() =>
                                  void runWithConfirm({
                                    title: '¿Eliminar mascota?',
                                    text: 'Esta acción es irreversible.',
                                    confirmText: 'Eliminar',
                                    destructive: true,
                                    action: (reason) => deletePet(pet.id, reason),
                                  })
                                }
                                className="p-2 rounded-lg hover:bg-primary/10 disabled:opacity-50"
                              >
                                <Trash
                                  className="w-4 h-4 text-primary"
                                  aria-hidden
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="space-y-4" aria-labelledby="admin-users">
            <div className="flex flex-wrap gap-3">
              <select
                value={userFilters.status}
                onChange={(e) =>
                  setUserFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                aria-label="Filtrar por estado de cuenta"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
              </select>
              <select
                value={userFilters.role}
                onChange={(e) =>
                  setUserFilters((prev) => ({ ...prev, role: e.target.value }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                aria-label="Filtrar por rol"
              >
                <option value="all">Todos los roles</option>
                <option value="user">Adoptante</option>
                <option value="shelter">Refugio</option>
                <option value="admin">Administrador</option>
              </select>
              <input
                type="search"
                value={localUserSearch}
                onChange={(e) => setLocalUserSearch(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 font-heading">Nombre</th>
                      <th className="px-4 py-3 font-heading">Email</th>
                      <th className="px-4 py-3 font-heading">Rol</th>
                      <th className="px-4 py-3 font-heading">Cuenta</th>
                      <th className="px-4 py-3 font-heading text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoadingUsers &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="px-4 py-4 h-10 bg-gray-50" />
                        </tr>
                      ))}
                    {!isLoadingUsers && users.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-gray-500"
                        >
                          No hay registros que coincidan con el filtro.
                        </td>
                      </tr>
                    )}
                    {!isLoadingUsers &&
                      users.map((user) => (
                        <tr key={user.profile_id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {user.display_name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {user.email ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {ROLE_LABELS[user.system_role] ?? user.system_role}
                          </td>
                          <td className="px-4 py-3 capitalize text-gray-600">
                            {user.account_status}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              {user.system_role !== 'admin' &&
                                user.account_status === 'suspended' && (
                                  <button
                                    type="button"
                                    disabled={isMutating}
                                    aria-label="Reactivar"
                                    onClick={() =>
                                      void runWithConfirm({
                                        title: '¿Reactivar usuario?',
                                        text: `Se restaurará el acceso de «${user.display_name}».`,
                                        confirmText: 'Reactivar',
                                        destructive: false,
                                        action: (reason) =>
                                          unsuspendUser(user.profile_id, reason),
                                      })
                                    }
                                    className="p-2 rounded-lg hover:bg-secondary/10 disabled:opacity-50"
                                  >
                                    <CheckCircle
                                      className="w-4 h-4 text-secondary"
                                      aria-hidden
                                    />
                                  </button>
                                )}
                              {user.system_role !== 'admin' &&
                                user.account_status === 'active' && (
                                  <button
                                    type="button"
                                    disabled={isMutating}
                                    aria-label="Suspender"
                                    onClick={() =>
                                      void runWithConfirm({
                                        title: '¿Suspender usuario?',
                                        text: `«${user.display_name}» no podrá crear solicitudes ni mascotas.`,
                                        confirmText: 'Suspender',
                                        destructive: true,
                                        action: (reason) =>
                                          suspendUser(user.profile_id, reason),
                                      })
                                    }
                                    className="p-2 rounded-lg hover:bg-primary/10 disabled:opacity-50"
                                  >
                                    <Shield
                                      className="w-4 h-4 text-primary"
                                      aria-hidden
                                    />
                                  </button>
                                )}
                              {user.system_role !== 'admin' && (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  aria-label="Eliminar"
                                  onClick={() =>
                                    void runWithConfirm({
                                      title: '¿Eliminar usuario?',
                                      text: 'Se eliminará el perfil y datos asociados. Irreversible.',
                                      confirmText: 'Eliminar',
                                      destructive: true,
                                      action: (reason) =>
                                        deleteUser(user.profile_id, reason),
                                    })
                                  }
                                  className="p-2 rounded-lg hover:bg-primary/10 disabled:opacity-50"
                                >
                                  <Trash
                                    className="w-4 h-4 text-primary"
                                    aria-hidden
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
