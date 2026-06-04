import { hasActiveSearchCriteria } from '../searchFilterUtils.js'

const VALID_ESPECIE = new Set(['perro', 'gato', 'otro'])
const VALID_EDAD = new Set(['', 'cachorro', 'adulto', 'senior'])
const VALID_TAMANO = new Set(['', 'pequeno', 'mediano', 'grande'])

/**
 * @param {object} criteria
 * @returns {string | null}
 */
export function validateSearchAlertCriteria(criteria) {
  if (!hasActiveSearchCriteria(criteria)) {
    return 'Define al menos un criterio para la alerta.'
  }

  if (Array.isArray(criteria.especie)) {
    for (const e of criteria.especie) {
      if (!VALID_ESPECIE.has(e)) {
        return 'Especie no válida.'
      }
    }
  }

  if (criteria.edadPreset != null && !VALID_EDAD.has(criteria.edadPreset)) {
    return 'Rango de edad no válido.'
  }

  if (criteria.tamano != null && !VALID_TAMANO.has(criteria.tamano)) {
    return 'Tamaño no válido.'
  }

  return null
}

/**
 * @param {import('@supabase/supabase-js').PostgrestError | Error | null} error
 * @returns {string}
 */
export function mapSearchAlertError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  const msg = error.message ?? ''

  if (msg.includes('límite de 5 alertas')) {
    return 'Puedes tener hasta 5 alertas de búsqueda.'
  }

  return msg || 'No se pudo guardar la alerta.'
}
