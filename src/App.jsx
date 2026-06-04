import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ClipboardList, Heart, Inbox, PawPrint, Shield } from 'lucide-react'
import Swal from 'sweetalert2'
import AuthPanel from './components/auth/AuthPanel.jsx'
import { supabase } from './lib/supabase.js'
import BrowsePetsPage from './pages/BrowsePetsPage.jsx'
import CreatePetPage from './pages/CreatePetPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import MyApplicationsPage from './pages/MyApplicationsPage.jsx'
import ShelterApplicationsPage from './pages/ShelterApplicationsPage.jsx'
import NotificationDropdown from './components/notifications/NotificationDropdown.jsx'
import { useFavorites } from './hooks/useFavorites.js'
import { useManageApplications } from './hooks/useManageApplications.js'
import { useNotifications } from './hooks/useNotifications.js'
import { usePets } from './hooks/usePets.js'
import { useProfile } from './hooks/useProfile.js'

export default function PublicApp() {
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [recentPet, setRecentPet] = useState(null)
  const [activeTab, setActiveTab] = useState('explore')
  const [exploreFocusPetId, setExploreFocusPetId] = useState(null)

  const userId = session?.user?.id ?? null
  const { refugioId, refugioNombre, isLoadingRefugio } = usePets()
  const manageApplications = useManageApplications(refugioId)
  const { pendingCount } = manageApplications
  const favorites = useFavorites(userId)
  const { count: favoritesCount } = favorites
  const notifications = useNotifications(userId)
  const { isAdmin, refetch: refetchProfile } = useProfile(userId)

  useEffect(() => {
    if (location.state?.forbidden) {
      void Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'No tienes permisos de administrador.',
        confirmButtonColor: '#E07A5F',
      })
      window.history.replaceState({}, document.title)
    } else if (location.state?.authRequired) {
      void Swal.fire({
        icon: 'warning',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para acceder al panel de administración.',
        confirmButtonColor: '#E07A5F',
      })
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const refreshSession = useCallback(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const tabClass = (tab) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${
      activeTab === tab
        ? 'bg-primary text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`

  const showRefugeTab = Boolean(session?.user && refugioId && !isLoadingRefugio)
  const showFavoritesTab = Boolean(session?.user)

  const handleAdoptionFromFavorites = (petId) => {
    setExploreFocusPetId(petId)
    setActiveTab('explore')
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-orange-50/80 via-white to-green-50/50">
      <header className="border-b border-primary/10 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary text-white">
              <PawPrint className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h1 className="font-heading text-xl md:text-2xl text-gray-900 leading-tight">
                Adopción de Mascotas
              </h1>
              <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-secondary" aria-hidden />
                Conecta refugios con adoptantes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap gap-2" aria-label="Secciones principales">
            <button type="button" onClick={() => setActiveTab('explore')} className={tabClass('explore')}>
              Explorar mascotas
            </button>
            {showFavoritesTab && (
              <button
                type="button"
                onClick={() => setActiveTab('favorites')}
                className={tabClass('favorites')}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="w-4 h-4" aria-hidden />
                  Mis Favoritos
                  {favoritesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/20 text-xs font-semibold">
                      {favoritesCount}
                    </span>
                  )}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('my-applications')}
              className={tabClass('my-applications')}
            >
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" aria-hidden />
                Mis solicitudes
              </span>
            </button>
            {showRefugeTab && (
              <button
                type="button"
                onClick={() => setActiveTab('shelter-applications')}
                className={tabClass('shelter-applications')}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Inbox className="w-4 h-4" aria-hidden />
                  Solicitudes recibidas
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/20 text-xs font-semibold">
                      {pendingCount}
                    </span>
                  )}
                </span>
              </button>
            )}
            <button type="button" onClick={() => setActiveTab('register')} className={tabClass('register')}>
              Registrar mascota
            </button>
            {session?.user && (
              <Link
                to="/admin"
                onClick={() => void refetchProfile()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5 ${
                  isAdmin
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-4 h-4" aria-hidden />
                Admin
              </Link>
            )}
          </nav>
          {session?.user && (
            <NotificationDropdown
              notifications={notifications.notifications}
              unreadCount={notifications.unreadCount}
              isLoading={notifications.isLoading}
              markAsRead={notifications.markAsRead}
              markAllAsRead={notifications.markAllAsRead}
            />
          )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'explore' && (
          <BrowsePetsPage
            session={session}
            onAuthChange={refreshSession}
            onGoToMyApplications={() => setActiveTab('my-applications')}
            favorites={favorites}
            focusPetId={exploreFocusPetId}
            onFocusHandled={() => setExploreFocusPetId(null)}
          />
        )}

        {activeTab === 'favorites' && showFavoritesTab && (
          <FavoritesPage
            userId={userId}
            favorites={favorites}
            onExplore={() => setActiveTab('explore')}
            onRequestAdoption={handleAdoptionFromFavorites}
          />
        )}

        {activeTab === 'my-applications' && (
          <MyApplicationsPage
            userId={userId}
            onExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'shelter-applications' && showRefugeTab && (
          <ShelterApplicationsPage
            refugioNombre={refugioNombre}
            manage={manageApplications}
            currentUserId={userId}
          />
        )}

        {activeTab === 'register' && (
          <>
            <AuthPanel session={session} onAuthChange={refreshSession} />
            {session?.user ? (
              <>
                <CreatePetPage onSuccess={(pet) => setRecentPet(pet)} />
                {recentPet && (
                  <aside className="max-w-2xl mx-auto bg-secondary/10 border border-secondary/30 rounded-xl p-4 text-sm text-gray-800">
                    <p className="font-heading font-semibold text-secondary mb-1">
                      Última mascota publicada
                    </p>
                    <p>
                      <strong>{recentPet.nombre}</strong> — {recentPet.especie},{' '}
                      {recentPet.raza}, {recentPet.edad}
                    </p>
                  </aside>
                )}
              </>
            ) : (
              <p className="text-center text-gray-600 text-sm py-8 max-w-2xl mx-auto">
                Inicia sesión como refugio para registrar el perfil de una mascota en
                adopción.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

