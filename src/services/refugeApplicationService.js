import { supabase } from '../lib/supabase.js'
import { mapSupabaseError } from './petService.js'

export { mapSupabaseError }

const SELECT_MANAGE_APPLICATIONS = `
  id, pet_id, applicant_id, status, mensaje_decision, decided_at,
  tipo_vivienda, tiene_patio, otras_mascotas, experiencia_previa, horas_solo, created_at,
  pets!inner (
    id, nombre, especie, raza, fotos_url, estado_adopcion, refugio_id
  ),
  applicants!inner (
    id, nombre, telefono, email
  )
`

const AUTO_REJECT_MESSAGE =
  'Otra solicitud fue aprobada para esta mascota. Gracias por tu interés.'

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
export function normalizeRefugeApplicationRow(row) {
  const petRaw = Array.isArray(row.pets) ? row.pets[0] : row.pets
  const applicantRaw = Array.isArray(row.applicants) ? row.applicants[0] : row.applicants

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
    pet_estado_adopcion: petRaw?.estado_adopcion ?? '',
    applicant_nombre: applicantRaw?.nombre ?? '',
    applicant_telefono: applicantRaw?.telefono ?? '',
    applicant_email: applicantRaw?.email ?? '',
  }
}

export async function fetchRefugeApplications() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión como refugio.')
  }

  const { data, error } = await supabase
    .from('adoption_applications')
    .select(SELECT_MANAGE_APPLICATIONS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeRefugeApplicationRow)
}

/**
 * @param {string} applicationId
 * @param {'approved' | 'rejected'} status
 * @param {string} [mensaje]
 */
export async function updateApplicationStatus(applicationId, status, mensaje = '') {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión como refugio.')
  }

  const payload = {
    status,
    mensaje_decision: mensaje.trim(),
    decided_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('adoption_applications')
    .update(payload)
    .eq('id', applicationId)
    .eq('status', 'pending')
    .select('id, pet_id, status, applicant_id')
    .maybeSingle()

  if (error) {
    const code = error.code ?? ''
    if (code === '42501' || error.message?.includes('row-level security')) {
      throw new Error(
        'No tienes permiso para actualizar esta solicitud. Verifica que seas el refugio dueño de la mascota.',
      )
    }
    throw error
  }

  if (!data) {
    throw new Error(
      'No se pudo actualizar. La solicitud ya fue procesada, no existe o no pertenece a tu refugio.',
    )
  }

  return data
}

/**
 * @param {string} petId
 * @param {string} excludeApplicationId
 */
async function rejectOtherPendingApplications(petId, excludeApplicationId) {
  const { data: others, error: fetchError } = await supabase
    .from('adoption_applications')
    .select('id')
    .eq('pet_id', petId)
    .eq('status', 'pending')
    .neq('id', excludeApplicationId)

  if (fetchError) throw fetchError

  for (const row of others ?? []) {
    await updateApplicationStatus(row.id, 'rejected', AUTO_REJECT_MESSAGE)
  }
}

/**
 * @param {string} petId
 */
async function setPetEnProceso(petId) {
  const { error } = await supabase
    .from('pets')
    .update({ estado_adopcion: 'en_proceso' })
    .eq('id', petId)

  if (error) throw error
}

/**
 * @param {string} applicationId
 * @param {string} [mensaje]
 */
export async function approveApplication(applicationId, mensaje = '') {
  const updated = await updateApplicationStatus(applicationId, 'approved', mensaje)
  await setPetEnProceso(updated.pet_id)
  await rejectOtherPendingApplications(updated.pet_id, applicationId)
  return updated
}

/**
 * @param {string} applicationId
 * @param {string} [mensaje]
 */
export async function rejectApplication(applicationId, mensaje = '') {
  return updateApplicationStatus(applicationId, 'rejected', mensaje)
}

/**
 * @param {string} applicationId
 */
export async function fetchApplicationMessages(applicationId) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
    .from('adoption_messages')
    .select('id, application_id, sender_role, sender_id, body, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * @param {string} applicationId
 * @param {string} body
 * @param {'refugio' | 'applicant'} senderRole
 */
export async function sendApplicationMessage(applicationId, body, senderRole) {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para enviar mensajes.')
  }

  const { data, error } = await supabase
    .from('adoption_messages')
    .insert({
      application_id: applicationId,
      sender_role: senderRole,
      sender_id: session.user.id,
      body: body.trim(),
    })
    .select('id, application_id, sender_role, sender_id, body, created_at')
    .single()

  if (error) throw error
  return data
}
