import { useState } from 'react'
import Swal from 'sweetalert2'
import { Filter, Search } from 'lucide-react'
import ApplicantAuthPanel from '../components/auth/ApplicantAuthPanel.jsx'
import ApplicantProfileSetup from '../components/adoption/ApplicantProfileSetup.jsx'
import PetDetail from '../components/pets/PetDetail.jsx'
import PetResultsGrid from '../components/search/PetResultsGrid.jsx'
import PetSearchSidebar from '../components/search/PetSearchSidebar.jsx'
import { useApplicant } from '../hooks/useApplicant.js'
import { usePetsSearch } from '../hooks/usePetsSearch.js'
import AdoptionApplicationPage from './AdoptionApplicationPage.jsx'

/**
 * @param {{
 *   session: object | null,
 *   onAuthChange: () => void,
 *   onGoToMyApplications: () => void,
 *   favorites: ReturnType<typeof import('../hooks/useFavorites.js').useFavorites>,
 *   focusPetId?: string | null,
 *   onFocusHandled?: () => void,
 * }} props
 */
export default function BrowsePetsPage({
  session,
  onAuthChange,
  onGoToMyApplications,
  favorites,
  focusPetId = null,
  onFocusHandled,
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [detailPetId, setDetailPetId] = useState(null)
  const [applicationPetId, setApplicationPetId] = useState(null)
  const [showApplicantAuth, setShowApplicantAuth] = useState(false)
  const [profileSetupPetId, setProfileSetupPetId] = useState(null)

  const userId = session?.user?.id ?? null
  const { isApplicant, isLoading: applicantLoading, ensureProfile } = useApplicant(userId)

  const { filters, setFilters, results, isLoading, error, clearFilters } = usePetsSearch()

  const { isFavorite, toggleFavorite, isMutating: favoritesMutating } = favorites

  const openApplication = (petId) => {
    setApplicationPetId(petId)
    setDetailPetId(null)
    setProfileSetupPetId(null)
    setShowApplicantAuth(false)
  }

  const handleRequestAdoption = async (petId) => {
    if (!session?.user) {
      setShowApplicantAuth(true)
      await Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Crea una cuenta de adoptante o inicia sesión para solicitar la adopción.',
        confirmButtonColor: '#E07A5F',
      })
      return
    }

    if (applicantLoading) return

    if (!isApplicant) {
      setProfileSetupPetId(petId)
      setDetailPetId(null)
      return
    }

    openApplication(petId)
  }

  const handleProfileSetup = async (profile) => {
    await ensureProfile({
      ...profile,
      email: session?.user?.email ?? '',
    })
    if (profileSetupPetId) {
      openApplication(profileSetupPetId)
    }
  }

  const handleApplicationSuccess = () => {
    setApplicationPetId(null)
    setDetailPetId(null)
    onGoToMyApplications()
  }

  if (applicationPetId && userId && isApplicant) {
    return (
      <AdoptionApplicationPage
        petId={applicationPetId}
        applicantId={userId}
        onBack={() => {
          setApplicationPetId(null)
          setDetailPetId(applicationPetId)
        }}
        onSuccess={handleApplicationSuccess}
      />
    )
  }

  if (profileSetupPetId && session?.user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <ApplicantProfileSetup
          defaultNombre={session.user.email?.split('@')[0] ?? ''}
          onSubmit={handleProfileSetup}
          onCancel={() => {
            setProfileSetupPetId(null)
            setDetailPetId(profileSetupPetId)
          }}
        />
      </div>
    )
  }

  const activeDetailId = focusPetId ?? detailPetId

  if (activeDetailId) {
    return (
      <PetDetail
        petId={activeDetailId}
        onBack={() => {
          if (focusPetId) onFocusHandled?.()
          else setDetailPetId(null)
        }}
        onRequestAdoption={handleRequestAdoption}
        isFavorite={isFavorite(activeDetailId)}
        onToggleFavorite={toggleFavorite}
        favoriteDisabled={favoritesMutating}
      />
    )
  }

  const sidebar = (
    <PetSearchSidebar
      filters={filters}
      onChange={setFilters}
      userId={userId}
      onClear={() => {
        clearFilters()
        setMobileFiltersOpen(false)
      }}
    />
  )

  return (
    <section aria-labelledby="explorar-mascotas">
      {(!session?.user || showApplicantAuth) && (
        <div className="max-w-md mx-auto mb-6">
          <ApplicantAuthPanel
            session={session}
            onAuthChange={() => {
              onAuthChange()
              setShowApplicantAuth(false)
            }}
            compact
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-secondary/15 text-secondary">
            <Search className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <h2 id="explorar-mascotas" className="font-heading text-2xl text-gray-900">
              Explorar mascotas
            </h2>
            <p className="text-sm text-gray-600">
              Encuentra a tu compañero ideal con filtros avanzados
            </p>
          </div>
        </div>
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium text-sm"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <div className="hidden lg:block w-72 shrink-0 sticky top-24">{sidebar}</div>

        <div className="flex-1 min-w-0">
          <PetResultsGrid
            pets={results}
            isLoading={isLoading}
            error={error}
            onSelectPet={setDetailPetId}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            favoriteDisabled={favoritesMutating}
          />
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar filtros"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-sm h-full bg-gray-50 p-4 overflow-y-auto shadow-xl">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="text-sm text-primary font-medium"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Cerrar
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </section>
  )
}
