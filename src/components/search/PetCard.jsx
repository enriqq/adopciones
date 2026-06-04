import { Baby, Cat, Dog, Heart, MapPin, Ruler } from 'lucide-react'

const TAMANO_LABELS = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
}

const ESTADO_LABELS = {
  disponible: 'Disponible',
  en_proceso: 'En proceso',
  adoptado: 'Adoptado',
}

const ESTADO_STYLES = {
  disponible: 'bg-secondary/15 text-secondary border-secondary/30',
  en_proceso: 'bg-amber-100 text-amber-800 border-amber-200',
  adoptado: 'bg-gray-100 text-gray-600 border-gray-200',
}

/**
 * @param {{
 *   pet: object,
 *   onSelect?: (id: string) => void,
 *   isFavorite?: boolean,
 *   onToggleFavorite?: (petId: string) => void,
 *   favoriteDisabled?: boolean,
 * }} props
 */
export default function PetCard({
  pet,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  favoriteDisabled = false,
}) {
  const foto = pet.fotos_url?.[0]
  const showFavorite = Boolean(onToggleFavorite)

  const handleSelect = () => {
    onSelect?.(pet.id)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect()
    }
  }

  return (
    <article
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      aria-label={`Ver perfil de ${pet.nombre}`}
    >
      <div className="aspect-[4/3] bg-gray-100 relative">
        {foto ? (
          <img
            src={foto}
            alt={pet.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Sin foto
          </div>
        )}
        {showFavorite && (
          <button
            type="button"
            disabled={favoriteDisabled}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.(pet.id)
            }}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-sm hover:bg-white transition disabled:opacity-50"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-current text-primary' : 'text-gray-400 hover:text-primary'
              }`}
              aria-hidden
            />
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-lg text-gray-900">{pet.nombre}</h3>
          {pet.estado_adopcion && pet.estado_adopcion !== 'disponible' && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                ESTADO_STYLES[pet.estado_adopcion] ?? ESTADO_STYLES.en_proceso
              }`}
            >
              {ESTADO_LABELS[pet.estado_adopcion] ?? pet.estado_adopcion}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 capitalize">
          {pet.especie} · {pet.raza}
        </p>
        <p className="text-sm text-gray-500">{pet.edad}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
            <Ruler className="w-3.5 h-3.5 text-secondary" aria-hidden />
            {TAMANO_LABELS[pet.tamano] ?? pet.tamano}
          </span>
          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
            {pet.ciudad}, {pet.refugio_estado}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {pet.compatible_ninos && (
            <span className="inline-flex items-center gap-1 text-xs bg-secondary/15 text-secondary px-2 py-0.5 rounded-full">
              <Baby className="w-3 h-3" aria-hidden />
              Niños
            </span>
          )}
          {pet.compatible_perros && (
            <span className="inline-flex items-center gap-1 text-xs bg-secondary/15 text-secondary px-2 py-0.5 rounded-full">
              <Dog className="w-3 h-3" aria-hidden />
              Perros
            </span>
          )}
          {pet.compatible_gatos && (
            <span className="inline-flex items-center gap-1 text-xs bg-secondary/15 text-secondary px-2 py-0.5 rounded-full">
              <Cat className="w-3 h-3" aria-hidden />
              Gatos
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">{pet.refugio_nombre}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleSelect()
          }}
          className="mt-2 text-sm font-medium text-primary hover:underline text-left"
        >
          Ver perfil completo
        </button>
      </div>
    </article>
  )
}
