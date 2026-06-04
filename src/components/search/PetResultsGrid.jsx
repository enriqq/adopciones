import { SearchX } from 'lucide-react'
import PetCard from './PetCard.jsx'
import PetGridSkeleton from './PetGridSkeleton.jsx'

/**
 * @param {{
 *   pets: object[],
 *   isLoading: boolean,
 *   error: string | null,
 *   onSelectPet?: (id: string) => void,
 * }} props
 */
export default function PetResultsGrid({ pets, isLoading, error, onSelectPet }) {
  if (isLoading) {
    return <PetGridSkeleton />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 text-center text-sm">
        {error}
      </div>
    )
  }

  if (!pets.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
        <SearchX className="w-12 h-12 mx-auto text-gray-300 mb-3" aria-hidden />
        <p className="font-heading text-lg text-gray-800">No encontramos mascotas</p>
        <p className="text-sm text-gray-500 mt-1">
          Prueba ajustando los filtros de búsqueda.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        <span className="font-medium text-secondary">{pets.length}</span>{' '}
        {pets.length === 1 ? 'mascota encontrada' : 'mascotas encontradas'}
      </p>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} onSelect={onSelectPet} />
        ))}
      </div>
    </div>
  )
}
