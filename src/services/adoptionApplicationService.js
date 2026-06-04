import { supabase } from '../lib/supabase.js'
import { mapSupabaseError } from './petService.js'

export { mapSupabaseError }

/**
 * @param {import('@supabase/supabase-js').PostgrestError | Error | null} error
 */
export function mapAdoptionError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  const code = error.code ?? ''
  const msg = error.message ?? ''

  if (code === '23505') {
    return 'Ya tienes una solicitud pendiente para esta mascota.'
  }
  if (code === '23503') {
    return 'Completa tu perfil de adoptante antes de continuar.'
  }
  if (code === '42501' || msg.includes('row-level security')) {
    return 'Debes iniciar sesión como adoptante para solicitar.'
  }
  return mapSupabaseError(error)
}

const SELECT_MY_APPLICATIONS = `
  id, pet_id, applicant_id, status,
  mensaje_decision, decided_at,
  tipo_vivienda, tiene_patio, otras_mascotas,
  experiencia_previa, horas_solo, created_at,
  pets (
    id, nombre, especie, raza, fotos_url,
    refugios ( nombre )
  )
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
export function normalizeApplicationRow(row) {
  const petRaw = Array.isArray(row.pets) ? row.pets[0] : row.pets
  const ref = petRaw?.refugios
    ? Array.isArray(petRaw.refugios)
      ? petRaw.refugios[0]
      : petRaw.refugios
    : null

  return {
    id: row.id,
    pet_id: row.pet_id,
    applicant_id: row.applicant_id,
    status: row.status,
    mensaje_decision: row.mensaje_decision ?? '',
    decided_at: row.decided_at ?? null,
    tipo_vivienda: row.tipo_vivienda,
    tiene_patio: row.tiene_patio,
    otras_mascotas: row.otras_mascotas ?? '',
    experiencia_previa: row.experiencia_previa,
    horas_solo: row.horas_solo,
    created_at: row.created_at,
    pet_nombre: petRaw?.nombre ?? '',
    pet_especie: petRaw?.especie ?? '',
    pet_raza: petRaw?.raza ?? '',
    pet_foto: parseFotos(petRaw?.fotos_url)[0] ?? null,
    refugio_nombre: ref?.nombre ?? '',
  }
}

/**
 * @param {string} userId
 */
export async function fetchApplicantProfile(userId) {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') }

  const { data, error } = await supabase
    .from('applicants')
    .select('id, nombre, telefono, email, created_at')
    .eq('id', userId)
    .maybeSingle()

  return { data, error }
}

/**
 * @param {string} userId
 * @param {{ nombre: string, telefono?: string, email?: string }} profile
 */
export async function ensureApplicantProfile(userId, profile) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const email = profile.email?.trim() ?? ''

  const { data: existing } = await supabase
    .from('applicants')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('applicants')
      .update({
        nombre: profile.nombre.trim(),
        telefono: profile.telefono?.trim() ?? '',
        email,
      })
      .eq('id', userId)

    if (error) throw error
    return existing
  }

  const { data, error } = await supabase
    .from('applicants')
    .insert({
      id: userId,
      nombre: profile.nombre.trim(),
      telefono: profile.telefono?.trim() ?? '',
      email,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

/**
 * @param {object} input
 * @param {string} applicantId
 */
export async function createApplication(input, applicantId) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
    .from('adoption_applications')
    .insert({
      pet_id: input.petId,
      applicant_id: applicantId,
      tipo_vivienda: input.tipo_vivienda,
      tiene_patio: Boolean(input.tiene_patio),
      otras_mascotas: input.otras_mascotas?.trim() ?? '',
      experiencia_previa: input.experiencia_previa.trim(),
      horas_solo: input.horas_solo,
      status: 'pending',
    })
    .select('id, pet_id, applicant_id, status, created_at')
    .single()

  if (error) throw error
  return {
    id: data.id,
    pet_id: data.pet_id,
    applicant_id: data.applicant_id,
    status: data.status,
    created_at: data.created_at,
  }
}

export async function fetchMyApplications() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para ver tus solicitudes.')
  }

  const { data, error } = await supabase
    .from('adoption_applications')
    .select(SELECT_MY_APPLICATIONS)
    .eq('applicant_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeApplicationRow)
}
