import { supabase } from '../lib/supabase.js'
import { normalizeCatalogRow } from './petSearchService.js'
import { mapSupabaseError } from './petService.js'

const SELECT_SHELTER = `
  id, nombre, ciudad, estado, user_id, created_at
`

/**
 * @param {object} row
 */
export function normalizeShelterRow(row) {
  return {
    id: row.id,
    nombre: row.nombre ?? '',
    ciudad: row.ciudad ?? '',
    estado: row.estado ?? '',
    user_id: row.user_id,
    created_at: row.created_at,
  }
}

/**
 * @param {string} shelterId
 * @param {AbortSignal} [signal]
 */
export async function fetchShelterProfile(shelterId, signal) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  let query = supabase.from('refugios').select(SELECT_SHELTER).eq('id', shelterId).maybeSingle()

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data) return null

  return normalizeShelterRow(data)
}

/**
 * @param {string} shelterId
 * @param {AbortSignal} [signal]
 */
export async function fetchShelterAvailablePets(shelterId, signal) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  let query = supabase
    .from('pets')
    .select(
      `
      id, nombre, especie, raza, edad, edad_anios, edad_meses, tamano,
      temperamento, descripcion, fotos_url,
      compatible_ninos, compatible_perros, compatible_gatos,
      estado_adopcion, refugio_id, created_at,
      refugios!inner ( nombre, ciudad, estado )
    `,
    )
    .eq('refugio_id', shelterId)
    .eq('estado_adopcion', 'disponible')
    .order('created_at', { ascending: false })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(normalizeCatalogRow)
}

export { mapSupabaseError }
