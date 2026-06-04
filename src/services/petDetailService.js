import { normalizeCatalogRow } from './petSearchService.js'
import { supabase } from '../lib/supabase.js'

const SELECT_DETAIL = `
  id, nombre, especie, raza, edad, edad_anios, edad_meses, tamano,
  temperamento, descripcion, fotos_url, requisitos_especiales,
  compatible_ninos, compatible_perros, compatible_gatos,
  estado_adopcion, refugio_id, created_at,
  refugios!inner ( nombre, ciudad, estado ),
  medical_records (
    id, vacunas, esterilizado, condiciones_especiales, notas_medicas
  )
`

/**
 * @param {unknown} raw
 */
export function normalizeMedicalRecord(raw) {
  const row = Array.isArray(raw) ? raw[0] : raw
  if (!row || typeof row !== 'object') return null

  return {
    id: row.id,
    vacunas: row.vacunas ?? '',
    esterilizado: Boolean(row.esterilizado),
    condiciones_especiales: row.condiciones_especiales ?? '',
    notas_medicas: row.notas_medicas ?? '',
  }
}

/**
 * @param {object} row
 */
export function normalizeDetailRow(row) {
  const base = normalizeCatalogRow(row)

  return {
    ...base,
    requisitos_especiales: row.requisitos_especiales ?? '',
    medicalRecord: normalizeMedicalRecord(row.medical_records),
  }
}

/**
 * @param {string} petId
 * @param {AbortSignal} [signal]
 */
export async function fetchPetDetail(petId, signal) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  // RLS decide visibilidad (disponible, guardada, solicitada, dueño refugio)
  let query = supabase.from('pets').select(SELECT_DETAIL).eq('id', petId).maybeSingle()

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query

  if (error) throw error
  if (!data) return null

  return normalizeDetailRow(data)
}
