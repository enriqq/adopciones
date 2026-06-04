import { Baby, Cat, Dog, MapPin, Ruler } from 'lucide-react'

const TAMANO_LABELS = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
}

/**
 * @param {{ pet: object }} props
 */
export default function PetCharacteristicBadges({ pet }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pet.tamano && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
          <Ruler className="w-3.5 h-3.5 text-secondary" aria-hidden />
          {TAMANO_LABELS[pet.tamano] ?? pet.tamano}
        </span>
      )}

      {(pet.ciudad || pet.refugio_estado) && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
          <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
          {[pet.ciudad, pet.refugio_estado].filter(Boolean).join(', ')}
        </span>
      )}

      {pet.compatible_ninos && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-secondary/15 text-secondary">
          <Baby className="w-3.5 h-3.5" aria-hidden />
          Niños
        </span>
      )}

      {pet.compatible_perros && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-secondary/15 text-secondary">
          <Dog className="w-3.5 h-3.5" aria-hidden />
          Perros
        </span>
      )}

      {pet.compatible_gatos && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-secondary/15 text-secondary">
          <Cat className="w-3.5 h-3.5" aria-hidden />
          Gatos
        </span>
      )}
    </div>
  )
}
