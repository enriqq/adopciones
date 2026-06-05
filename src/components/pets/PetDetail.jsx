import { AlertTriangle, ArrowLeft, ChevronRight, Heart, MapPin } from 'lucide-react'
import { usePetDetail } from '../../hooks/usePetDetail.js'
import PetCharacteristicBadges from './PetCharacteristicBadges.jsx'
import PetDetailSkeleton from './PetDetailSkeleton.jsx'
import PetMedicalCard from './PetMedicalCard.jsx'
import PetPhotoCarousel from './PetPhotoCarousel.jsx'

/**
 * @param {{
 *   petId: string,
 *   onBack: () => void,
 *   onRequestAdoption: (petId: string) => void,
 *   onViewShelter?: (shelterId: string) => void,
 *   isFavorite?: boolean,
 *   onToggleFavorite?: (petId: string) => void,
 *   favoriteDisabled?: boolean,
 * }} props
 */
export default function PetDetail({
  petId,
  onBack,
  onRequestAdoption,
  onViewShelter,
  isFavorite = false,
  onToggleFavorite,
  favoriteDisabled = false,
}) {
  const { pet, isLoading, error, notFound } = usePetDetail(petId)

  const handleAdopt = () => {
    onRequestAdoption(petId)
  }

  if (isLoading) {
    return <PetDetailSkeleton />
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-6 text-sm font-body">
          {error}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline font-body"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Volver al catálogo
        </button>
      </div>
    )
  }

  if (notFound || !pet) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="font-heading text-2xl text-gray-900">Mascota no disponible</h2>
        <p className="text-sm text-gray-600 font-body">
          Esta mascota no existe o ya no está en adopción.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline font-body"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Volver al catálogo
        </button>
      </div>
    )
  }

  const requisitos = pet.requisitos_especiales?.trim()

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition font-body"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Volver al catálogo
      </button>

      <PetPhotoCarousel photos={pet.fotos_url} alt={pet.nombre} />

      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-gray-900">{pet.nombre}</h1>
            <p className="text-gray-600 capitalize font-body">
              {pet.especie} · {pet.raza} · {pet.edad}
            </p>
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              disabled={favoriteDisabled}
              onClick={() => onToggleFavorite(petId)}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium font-body hover:border-primary/30 transition disabled:opacity-50"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-current text-primary' : 'text-gray-500'
                }`}
                aria-hidden
              />
              {isFavorite ? 'En favoritos' : 'Guardar'}
            </button>
          )}
        </div>
      </header>

      <PetCharacteristicBadges pet={pet} />

      <section className="space-y-3">
        <h2 className="font-heading text-xl text-gray-900 border-b border-gray-200 pb-2">
          Sobre mí
        </h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line font-body">{pet.descripcion}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl text-gray-900 border-b border-gray-200 pb-2">
          Temperamento
        </h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line font-body">{pet.temperamento}</p>
      </section>

      <PetMedicalCard record={pet.medicalRecord} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary shrink-0" aria-hidden />
          <h2 className="font-heading text-xl text-gray-900">Requisitos para el hogar</h2>
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line font-body">
          {requisitos || 'Sin requisitos especiales para el hogar.'}
        </p>
      </section>

      {pet.refugio_id && onViewShelter ? (
        <button
          type="button"
          onClick={() => onViewShelter(pet.refugio_id)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5 transition text-left group"
        >
          <span className="flex items-center gap-2 text-sm text-gray-600 font-body">
            <MapPin className="w-4 h-4 text-secondary shrink-0" aria-hidden />
            <span>
              <span className="font-medium text-gray-800 group-hover:text-primary transition">
                {pet.refugio_nombre}
              </span>
              {(pet.ciudad || pet.refugio_estado) && (
                <> · {[pet.ciudad, pet.refugio_estado].filter(Boolean).join(', ')}</>
              )}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary shrink-0 font-body">
            Ver refugio
            <ChevronRight className="w-4 h-4" aria-hidden />
          </span>
        </button>
      ) : (
        <p className="flex items-center gap-2 text-sm text-gray-500 font-body">
          <MapPin className="w-4 h-4 text-secondary shrink-0" aria-hidden />
          <span>
            <span className="font-medium text-gray-700">{pet.refugio_nombre}</span>
            {(pet.ciudad || pet.refugio_estado) && (
              <> · {[pet.ciudad, pet.refugio_estado].filter(Boolean).join(', ')}</>
            )}
          </span>
        </p>
      )}

      {pet.estado_adopcion === 'disponible' ? (
        <button
          type="button"
          onClick={handleAdopt}
          className="w-full py-5 text-xl font-heading rounded-2xl bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <Heart className="w-6 h-6" aria-hidden />
          Adoptar
        </button>
      ) : (
        <p className="text-sm text-center text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-body">
          Esta mascota ya no está disponible para nuevas solicitudes de adopción.
        </p>
      )}
    </article>
  )
}
