import { EDAD_PRESETS } from './constants/petSearchOptions.js'

/**
 * @param {object} filters
 */
export function hasActiveSearchCriteria(filters) {
  if (!filters || typeof filters !== 'object') return false

  if (Array.isArray(filters.especie) && filters.especie.length > 0) return true
  if (filters.raza?.trim()) return true
  if (filters.edadPreset && EDAD_PRESETS[filters.edadPreset]) return true
  if (filters.tamano?.trim()) return true
  if (filters.ciudad?.trim()) return true
  if (filters.estado?.trim()) return true
  if (filters.compatibleNinos) return true
  if (filters.compatiblePerros) return true
  if (filters.compatibleGatos) return true

  return false
}

/**
 * @param {object} filters
 */
export function normalizeCriteriaJson(filters) {
  return {
    especie: Array.isArray(filters.especie) ? filters.especie : [],
    raza: filters.raza?.trim() ?? '',
    edadPreset: filters.edadPreset ?? '',
    tamano: filters.tamano ?? '',
    ciudad: filters.ciudad?.trim() ?? '',
    estado: filters.estado?.trim() ?? '',
    compatibleNinos: Boolean(filters.compatibleNinos),
    compatiblePerros: Boolean(filters.compatiblePerros),
    compatibleGatos: Boolean(filters.compatibleGatos),
  }
}
