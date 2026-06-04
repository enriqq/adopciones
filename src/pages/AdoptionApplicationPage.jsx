import { ArrowLeft } from 'lucide-react'
import AdoptionForm from '../components/adoption/AdoptionForm.jsx'
import PetDetailSkeleton from '../components/pets/PetDetailSkeleton.jsx'
import { usePetDetail } from '../hooks/usePetDetail.js'

/**
 * @param {{
 *   petId: string,
 *   applicantId: string,
 *   onBack: () => void,
 *   onSuccess: () => void,
 * }} props
 */
export default function AdoptionApplicationPage({
  petId,
  applicantId,
  onBack,
  onSuccess,
}) {
  const { pet, isLoading, error, notFound } = usePetDetail(petId)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PetDetailSkeleton />
      </div>
    )
  }

  if (error || notFound || !pet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="font-heading text-2xl text-gray-900">Mascota no disponible</h2>
        <p className="text-sm text-gray-600">
          {error ?? 'Esta mascota ya no está en adopción.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Volver al perfil
      </button>

      <header>
        <h1 className="font-heading text-2xl md:text-3xl text-gray-900">
          Solicitud de adopción
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Completa los pasos para que el refugio conozca tu hogar y experiencia.
        </p>
      </header>

      <AdoptionForm
        petId={petId}
        applicantId={applicantId}
        petSummary={{
          nombre: pet.nombre,
          foto: pet.fotos_url?.[0] ?? null,
          refugio_nombre: pet.refugio_nombre,
        }}
        onSuccess={onSuccess}
        onCancel={onBack}
      />
    </div>
  )
}
