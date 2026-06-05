import { supabase } from '../lib/supabase.js'
import { mapSupabaseError } from './petService.js'

export function mapShelterRequestError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  const code = error.code ?? ''
  const msg = error.message ?? ''

  if (code === '23505') {
    return 'Ya tienes una solicitud de refugio pendiente.'
  }
  if (code === '42501' || msg.includes('row-level security')) {
    return 'No tienes permiso para enviar esta solicitud. Si ya tenías un refugio de prueba, aplica la migración 033 en Supabase o contacta al administrador.'
  }
  if (msg.includes('Ya tienes una solicitud pendiente')) {
    return 'Ya tienes una solicitud de refugio pendiente.'
  }
  if (msg.includes('ya tiene permisos de refugio')) {
    return 'Tu cuenta ya está configurada como refugio o administrador.'
  }
  return mapSupabaseError(error)
}

/**
 * @param {object} row
 */
export function normalizeShelterRequestRow(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    nombre_refugio: row.nombre_refugio,
    direccion: row.direccion,
    telefono: row.telefono,
    status: row.status,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at ?? null,
  }
}

/**
 * @param {string} userId
 */
export async function fetchMyShelterRequests(userId) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('shelter_requests')
    .select('id, user_id, nombre_refugio, direccion, telefono, status, created_at, reviewed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeShelterRequestRow)
}

/**
 * @param {{
 *   nombre_refugio: string,
 *   direccion: string,
 *   telefono: string,
 * }} input
 */
export async function submitShelterRequest(input) {
  if (!supabase) {
    throw new Error('Supabase no está configurado.')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para solicitar una cuenta de refugio.')
  }

  const payload = {
    p_nombre_refugio: input.nombre_refugio.trim(),
    p_direccion: input.direccion.trim(),
    p_telefono: input.telefono.trim(),
  }

  const { data: rpcId, error: rpcError } = await supabase.rpc('submit_shelter_request', payload)

  if (!rpcError && rpcId) {
    const rows = await fetchMyShelterRequests(session.user.id)
    const created = rows.find((r) => r.id === rpcId)
    if (created) return created
  }

  const { data, error } = await supabase
    .from('shelter_requests')
    .insert({
      user_id: session.user.id,
      nombre_refugio: payload.p_nombre_refugio,
      direccion: payload.p_direccion,
      telefono: payload.p_telefono,
      status: 'pending',
    })
    .select('id, user_id, nombre_refugio, direccion, telefono, status, created_at, reviewed_at')
    .single()

  if (error) {
    if (!rpcError) throw error
    throw rpcError
  }
  return normalizeShelterRequestRow(data)
}
