import { SearchX } from 'lucide-react'
import PetCard from './PetCard.jsx'
import PetGridSkeleton from './PetGridSkeleton.jsx'

/**
 * @param {{
 *   pets: object[],
 *   isLoading: boolean,
 *   error: string | null,
 *   onSelectPet?: (id: string) => void,
 *   isFavorite?: (petId: string) => boolean,
 *   onToggleFavorite?: (petId: string) => void,
 *   favoriteDisabled?: boolean,
 *   countLabel?: (count: number) => string,
 *   emptyTitle?: string,
 *   emptyMessage?: string,
 *   emptyAction?: import('react').ReactNode,
 * }} props
 */
export default function PetResultsGrid({
  pets,
  isLoading,
  error,
  onSelectPet,
  isFavorite,
  onToggleFavorite,
  favoriteDisabled = false,
  countLabel,
  emptyTitle = 'No encontramos mascotas',
  emptyMessage = 'Prueba ajustando los filtros de búsqueda.',
  emptyAction = null,
}) {
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
      <div className="bg-white border border-gray-100 rounded-xl p-12 text-center space-y-4">
        <SearchX className="w-12 h-12 mx-auto text-gray-300" aria-hidden />
        <p className="font-heading text-lg text-gray-800">{emptyTitle}</p>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
        {emptyAction}
      </div>
    )
  }

  const defaultCountLabel = (count) =>
    count === 1 ? 'mascota encontrada' : 'mascotas encontradas'

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        <span className="font-medium text-secondary">{pets.length}</span>{' '}
        {countLabel ? countLabel(pets.length) : defaultCountLabel(pets.length)}
      </p>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            onSelect={onSelectPet}
            isFavorite={isFavorite?.(pet.id) ?? false}
            onToggleFavorite={onToggleFavorite}
            favoriteDisabled={favoriteDisabled}
          />
        ))}
      </div>
    </div>
  )
}
