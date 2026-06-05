import { ArrowLeft, Building2, MapPin, PawPrint } from 'lucide-react'
import { useShelterProfile } from '../hooks/useShelterProfile.js'
import ReviewSection from '../components/reviews/ReviewSection.jsx'
import PetResultsGrid from '../components/search/PetResultsGrid.jsx'

/**
 * @param {{
 *   shelterId: string,
 *   onBack: () => void,
 *   session?: object | null,
 *   onLoginPrompt?: () => void,
 *   onSelectPet?: (petId: string) => void,
 *   isFavorite?: (petId: string) => boolean,
 *   onToggleFavorite?: (petId: string) => void,
 *   favoriteDisabled?: boolean,
 * }} props
 */
export default function ShelterProfilePage({
  shelterId,
  onBack,
  session = null,
  onLoginPrompt,
  onSelectPet,
  isFavorite,
  onToggleFavorite,
  favoriteDisabled = false,
}) {
  const { shelter, pets, isLoading, error, notFound } = useShelterProfile(shelterId)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-6 text-sm font-body">
          {error}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline font-body"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Volver
        </button>
      </div>
    )
  }

  if (notFound || !shelter) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="font-heading text-2xl text-gray-900">Refugio no encontrado</h2>
        <p className="text-sm text-gray-600 font-body">
          Este refugio no existe o no tiene mascotas disponibles en el catálogo.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline font-body"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Volver
        </button>
      </div>
    )
  }

  const location = [shelter.ciudad, shelter.estado].filter(Boolean).join(', ')

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition font-body"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Volver
      </button>

      <header className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-secondary/15 text-secondary shrink-0">
            <Building2 className="w-8 h-8" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl md:text-4xl text-gray-900">{shelter.nombre}</h1>
            {location && (
              <p className="flex items-center gap-2 text-sm text-gray-600 font-body">
                <MapPin className="w-4 h-4 text-secondary shrink-0" aria-hidden />
                {location}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 font-body max-w-2xl">
          Conoce las valoraciones de otros adoptantes y explora las mascotas disponibles en este
          refugio.
        </p>
      </header>

      <ReviewSection
        shelterId={shelter.id}
        shelterNombre={shelter.nombre}
        session={session}
        onLoginPrompt={onLoginPrompt}
      />

      <section className="space-y-4" aria-labelledby="shelter-pets-heading">
        <div className="flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-primary" aria-hidden />
          <h2 id="shelter-pets-heading" className="font-heading text-xl text-gray-900">
            Mascotas disponibles
          </h2>
        </div>

        <PetResultsGrid
          pets={pets}
          isLoading={false}
          error={null}
          onSelectPet={onSelectPet}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          favoriteDisabled={favoriteDisabled}
          countLabel={(n) => (n === 1 ? 'mascota disponible' : 'mascotas disponibles')}
          emptyTitle="Sin mascotas disponibles"
          emptyMessage="Este refugio no tiene mascotas en adopción en este momento."
        />
      </section>
    </article>
  )
}
