import { EDAD_PRESETS } from '../lib/constants/petSearchOptions.js'
import { supabase } from '../lib/supabase.js'
import { normalizePetRow } from './petService.js'

const SELECT_COLUMNS = `
  id, nombre, especie, raza, edad, edad_anios, edad_meses, tamano,
  temperamento, descripcion, fotos_url,
  compatible_ninos, compatible_perros, compatible_gatos,
  estado_adopcion, refugio_id, created_at,
  refugios!inner ( nombre, ciudad, estado )
`

function parseFotos(fotos_url) {
  if (Array.isArray(fotos_url)) return fotos_url
  if (typeof fotos_url === 'string') {
    try {
      return JSON.parse(fotos_url)
    } catch {
      return []
    }
  }
  return []
}

/**
 * @param {object} row
 */
export function normalizeCatalogRow(row) {
  const ref = Array.isArray(row.refugios) ? row.refugios[0] : row.refugios
  const base = normalizePetRow(row)

  return {
    ...base,
    edad_anios: row.edad_anios,
    edad_meses: row.edad_meses,
    tamano: row.tamano,
    compatible_ninos: row.compatible_ninos,
    compatible_perros: row.compatible_perros,
    compatible_gatos: row.compatible_gatos,
    estado_adopcion: row.estado_adopcion,
    refugio_nombre: ref?.nombre ?? '',
    ciudad: ref?.ciudad ?? '',
    refugio_estado: ref?.estado ?? '',
    fotos_url: parseFotos(row.fotos_url),
  }
}

/** @param {string} value */
function escapeIlike(value) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/**
 * @param {object} filters
 * @param {AbortSignal} [signal]
 */
export function buildSearchQuery(filters, signal) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  let query = supabase
    .from('pets')
    .select(SELECT_COLUMNS)
    .eq('estado_adopcion', 'disponible')

  if (signal) {
    query = query.abortSignal(signal)
  }

  if (filters.especie?.length === 1) {
    query = query.eq('especie', filters.especie[0])
  } else if (filters.especie?.length > 1) {
    query = query.in('especie', filters.especie)
  }

  if (filters.tamano) {
    query = query.eq('tamano', filters.tamano)
  }

  const raza = filters.raza?.trim()
  if (raza) {
    query = query.ilike('raza', `%${escapeIlike(raza)}%`)
  }

  const preset = EDAD_PRESETS[filters.edadPreset] ?? EDAD_PRESETS['']
  if (preset.min != null) {
    query = query.gte('edad_anios', preset.min)
  }
  if (preset.max != null) {
    query = query.lte('edad_anios', preset.max)
  }

  if (filters.compatibleNinos) {
    query = query.eq('compatible_ninos', true)
  }
  if (filters.compatiblePerros) {
    query = query.eq('compatible_perros', true)
  }
  if (filters.compatibleGatos) {
    query = query.eq('compatible_gatos', true)
  }

  const ciudad = filters.ciudad?.trim()
  if (ciudad) {
    query = query.ilike('refugios.ciudad', `%${escapeIlike(ciudad)}%`)
  }

  const estado = filters.estado?.trim()
  if (estado) {
    query = query.ilike('refugios.estado', `%${escapeIlike(estado)}%`)
  }

  return query.order('created_at', { ascending: false })
}

/**
 * @param {object} filters
 * @param {AbortSignal} [signal]
 */
export async function searchPets(filters, signal) {
  const { data, error } = await buildSearchQuery(filters, signal)
  if (error) throw error
  return (data ?? []).map(normalizeCatalogRow)
}
