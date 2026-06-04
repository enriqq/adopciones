import { Filter, SlidersHorizontal, X } from 'lucide-react'
import SearchAlertSaveButton from '../notifications/SearchAlertSaveButton.jsx'
import {
  EDAD_PRESETS,
  ESPECIE_OPTIONS,
  TAMANO_OPTIONS,
} from '../../lib/constants/petSearchOptions.js'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none'

/**
 * @param {{
 *   filters: object,
 *   onChange: (updater: object | ((prev: object) => object)) => void,
 *   onClear: () => void,
 *   userId?: string | null,
 *   className?: string,
 * }} props
 */
export default function PetSearchSidebar({
  filters,
  onChange,
  onClear,
  userId = null,
  className = '',
}) {
  const set = (partial) =>
    onChange((prev) => ({
      ...prev,
      ...partial,
    }))

  const toggleEspecie = (value) => {
    const current = filters.especie ?? []
    const next = current.includes(value)
      ? current.filter((e) => e !== value)
      : [...current, value]
    set({ especie: next })
  }

  return (
    <aside
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-primary">
          <SlidersHorizontal className="w-5 h-5" aria-hidden />
          <h2 className="font-heading text-lg text-gray-900">Filtros</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-secondary hover:underline inline-flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">Especie</legend>
        <div className="flex flex-wrap gap-2">
          {ESPECIE_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition ${
                filters.especie?.includes(value)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary/50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.especie?.includes(value) ?? false}
                onChange={() => toggleEspecie(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="search-raza" className="text-sm font-medium text-gray-700">
          Raza
        </label>
        <input
          id="search-raza"
          type="text"
          className={`${inputClass} mt-1`}
          placeholder="ej. Labrador"
          value={filters.raza}
          onChange={(e) => set({ raza: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="search-edad" className="text-sm font-medium text-gray-700">
          Edad
        </label>
        <select
          id="search-edad"
          className={`${inputClass} mt-1`}
          value={filters.edadPreset}
          onChange={(e) => set({ edadPreset: e.target.value })}
        >
          {Object.entries(EDAD_PRESETS).map(([key, { label }]) => (
            <option key={key || 'all'} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="search-tamano" className="text-sm font-medium text-gray-700">
          Tamaño
        </label>
        <select
          id="search-tamano"
          className={`${inputClass} mt-1`}
          value={filters.tamano}
          onChange={(e) => set({ tamano: e.target.value })}
        >
          {TAMANO_OPTIONS.map(({ value, label }) => (
            <option key={value || 'all'} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="search-ciudad" className="text-sm font-medium text-gray-700">
          Ciudad
        </label>
        <input
          id="search-ciudad"
          type="text"
          className={`${inputClass} mt-1`}
          placeholder="ej. Aguascalientes"
          value={filters.ciudad}
          onChange={(e) => set({ ciudad: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="search-estado" className="text-sm font-medium text-gray-700">
          Estado / región
        </label>
        <input
          id="search-estado"
          type="text"
          className={`${inputClass} mt-1`}
          placeholder="ej. Ags."
          value={filters.estado}
          onChange={(e) => set({ estado: e.target.value })}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">Compatibilidad</legend>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={filters.compatibleNinos}
            onChange={(e) => set({ compatibleNinos: e.target.checked })}
          />
          Con niños
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={filters.compatiblePerros}
            onChange={(e) => set({ compatiblePerros: e.target.checked })}
          />
          Con perros
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={filters.compatibleGatos}
            onChange={(e) => set({ compatibleGatos: e.target.checked })}
          />
          Con gatos
        </label>
      </fieldset>

      <SearchAlertSaveButton filters={filters} userId={userId} />

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <Filter className="w-3.5 h-3.5" />
        La búsqueda de texto espera 400 ms tras escribir.
      </p>
    </aside>
  )
}
