import { supabase } from '../lib/supabase.js'
import {
  validateApplicationId,
  validateMessageContent,
  validateReceiverId,
} from '../lib/validators/messageValidators.js'
import { mapSupabaseError } from './petService.js'

export { mapSupabaseError }

async function requireSessionUserId() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para enviar mensajes.')
  }

  return session.user.id
}

/**
 * @param {string} applicationId
 */
export async function fetchMessages(applicationId) {
  const appError = validateApplicationId(applicationId)
  if (appError) throw new Error(appError)

  if (!supabase) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase
    .from('messages')
    .select('id, application_id, sender_id, receiver_id, content, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * @param {string} applicationId
 */
export async function resolveReceiverId(applicationId) {
  const appError = validateApplicationId(applicationId)
  if (appError) throw new Error(appError)

  if (!supabase) throw new Error('Supabase no está configurado.')

  const senderId = await requireSessionUserId()

  const { data, error } = await supabase
    .from('adoption_applications')
    .select(
      `
      applicant_id,
      pets!inner (
        refugios!inner ( user_id )
      )
    `,
    )
    .eq('id', applicationId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Solicitud no encontrada.')

  const petRaw = Array.isArray(data.pets) ? data.pets[0] : data.pets
  const refRaw = Array.isArray(petRaw?.refugios) ? petRaw.refugios[0] : petRaw?.refugios
  const refugeUserId = refRaw?.user_id
  const applicantId = data.applicant_id

  if (!refugeUserId || !applicantId) {
    throw new Error('No se pudo resolver los participantes de la conversación.')
  }

  let receiverId
  if (senderId === applicantId) receiverId = refugeUserId
  else if (senderId === refugeUserId) receiverId = applicantId
  else throw new Error('No participas en esta conversación.')

  if (receiverId === senderId) {
    throw new Error(
      'No puedes chatear contigo mismo en esta solicitud. Usa una cuenta de adoptante distinta a la del refugio.',
    )
  }

  return receiverId
}

/**
 * @param {{ applicationId: string, content: string }} params
 */
export async function sendMessage({ applicationId, content }) {
  const appError = validateApplicationId(applicationId)
  if (appError) throw new Error(appError)

  const contentError = validateMessageContent(content)
  if (contentError) throw new Error(contentError)

  const senderId = await requireSessionUserId()
  const receiverId = await resolveReceiverId(applicationId)

  const receiverError = validateReceiverId(receiverId, senderId)
  if (receiverError) throw new Error(receiverError)

  const { data, error } = await supabase
    .from('messages')
    .insert({
      application_id: applicationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
    })
    .select('id, application_id, sender_id, receiver_id, content, created_at')
    .single()

  if (error) throw error
  return data
}
