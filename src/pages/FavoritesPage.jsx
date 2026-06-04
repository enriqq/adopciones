import { useState } from 'react'
import { Heart, Search } from 'lucide-react'
import PetDetail from '../components/pets/PetDetail.jsx'
import PetResultsGrid from '../components/search/PetResultsGrid.jsx'

/**
 * @param {{
 *   userId: string | null,
 *   favorites: ReturnType<typeof import('../hooks/useFavorites.js').useFavorites>,
 *   onExplore: () => void,
 *   onRequestAdoption: (petId: string) => void,
 * }} props
 */
export default function FavoritesPage({
  userId,
  favorites,
  onExplore,
  onRequestAdoption,
}) {
  const [detailPetId, setDetailPetId] = useState(null)

  const {
    savedPets,
    isLoading,
    error,
    isMutating,
    isFavorite,
    toggleFavorite,
    count,
  } = favorites

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
        <p className="text-gray-600 text-sm">
          Inicia sesión para ver tus mascotas favoritas.
        </p>
      </div>
    )
  }

  if (detailPetId) {
    return (
      <PetDetail
        petId={detailPetId}
        onBack={() => setDetailPetId(null)}
        onRequestAdoption={onRequestAdoption}
        isFavorite={isFavorite(detailPetId)}
        onToggleFavorite={toggleFavorite}
        favoriteDisabled={isMutating}
      />
    )
  }

  return (
    <section className="space-y-6" aria-labelledby="mis-favoritos">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Heart className="w-6 h-6 fill-current" aria-hidden />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="mis-favoritos" className="font-heading text-2xl text-gray-900">
              Mis Favoritos
            </h2>
            {count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-secondary text-white text-xs font-semibold">
                {count}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Mascotas que guardaste para revisar y comparar
          </p>
        </div>
      </div>

      <PetResultsGrid
        pets={savedPets}
        isLoading={isLoading}
        error={error}
        onSelectPet={setDetailPetId}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        favoriteDisabled={isMutating}
        countLabel={(n) => (n === 1 ? 'mascota guardada' : 'mascotas guardadas')}
        emptyTitle="Aún no tienes favoritos"
        emptyMessage="Explora el catálogo y pulsa el corazón en las mascotas que te interesen."
        emptyAction={
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Search className="w-4 h-4" aria-hidden />
            Explorar mascotas
          </button>
        }
      />
    </section>
  )
}
