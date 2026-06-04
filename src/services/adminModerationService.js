import { supabase } from '../lib/supabase.js'
import {
  validateModerationId,
  validateModerationReason,
} from '../lib/validators/moderationValidators.js'
import { mapSupabaseError } from './profileService.js'

export { mapSupabaseError }

async function requireAdminSession() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión.')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('system_role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw error
  if (profile?.system_role !== 'admin') {
    throw new Error('No tienes permisos de administrador.')
  }

  return session.user.id
}

/**
 * @param {{
 *   action: string,
 *   targetType: string,
 *   targetId: string,
 *   reason: string,
 *   metadata?: object,
 * }} params
 */
async function insertModerationLog({
  action,
  targetType,
  targetId,
  reason,
  metadata = {},
}) {
  const adminId = await requireAdminSession()

  const { error } = await supabase.from('moderation_logs').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    reason: reason.trim(),
    metadata,
  })

  if (error) throw error
}

/**
 * @param {{ status?: string, search?: string }} [filters]
 */
export async function fetchAdminPets(filters = {}) {
  await requireAdminSession()

  let query = supabase
    .from('v_admin_pets_moderation')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('moderation_status', filters.status)
  }

  if (filters.search?.trim()) {
    query = query.ilike('nombre', `%${filters.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/**
 * @param {{ status?: string, role?: string, search?: string }} [filters]
 */
export async function fetchAdminUsers(filters = {}) {
  await requireAdminSession()

  let query = supabase
    .from('v_admin_users_moderation')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('account_status', filters.status)
  }

  if (filters.role && filters.role !== 'all') {
    query = query.eq('system_role', filters.role)
  }

  const { data, error } = await query
  if (error) throw error

  let rows = data ?? []
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    rows = rows.filter(
      (row) =>
        row.display_name?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q),
    )
  }
  return rows
}

/**
 * @param {string} petId
 * @param {string} reason
 */
export async function approvePet(petId, reason) {
  const idError = validateModerationId(petId)
  if (idError) throw new Error(idError)
  const reasonError = validateModerationReason(reason)
  if (reasonError) throw new Error(reasonError)

  const adminId = await requireAdminSession()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('pets')
    .update({
      moderation_status: 'approved',
      moderation_reason: null,
      moderated_at: now,
      moderated_by: adminId,
    })
    .eq('id', petId)

  if (error) throw error

  await insertModerationLog({
    action: 'pet_approve',
    targetType: 'pet',
    targetId: petId,
    reason,
  })
}

/**
 * @param {string} petId
 * @param {string} reason
 */
export async function suspendPet(petId, reason) {
  const idError = validateModerationId(petId)
  if (idError) throw new Error(idError)
  const reasonError = validateModerationReason(reason)
  if (reasonError) throw new Error(reasonError)

  const adminId = await requireAdminSession()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('pets')
    .update({
      moderation_status: 'suspended',
      moderation_reason: reason.trim(),
      moderated_at: now,
      moderated_by: adminId,
    })
    .eq('id', petId)

  if (error) throw error

  await insertModerationLog({
    action: 'pet_suspend',
    targetType: 'pet',
    targetId: petId,
    reason,
  })
}

/**
 * @param {string} petId
 * @param {string} reason
 */
export async function deletePet(petId, reason) {
  const idError = validateModerationId(petId)
  if (idError) throw new Error(idError)
  const reasonError = validateModerationReason(reason)
  if (reasonError) throw new Error(reasonError)

  const { error } = await supabase.from('pets').delete().eq('id', petId)
  if (error) throw error

  await insertModerationLog({
    action: 'pet_delete',
    targetType: 'pet',
    targetId: petId,
    reason,
  })
}

/**
 * @param {string} profileId
 * @param {string} reason
 */
export async function suspendUser(profileId, reason) {
  const idError = validateModerationId(profileId)
  if (idError) throw new Error(idError)
  const reasonError = validateModerationReason(reason)
  if (reasonError) throw new Error(reasonError)

  const adminId = await requireAdminSession()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('profiles')
    .update({
      account_status: 'suspended',
      suspension_reason: reason.trim(),
      suspended_at: now,
      suspended_by: adminId,
    })
    .eq('id', profileId)

  if (error) throw error

  await insertModerationLog({
    action: 'user_suspend',
    targetType: 'profile',
    targetId: profileId,
    reason,
  })
}

/**
 * @param {string} profileId
 * @param {string} reason
 */
export async function unsuspendUser(profileId, reason) {
  const idError = validateModerationId(profileId)
  if (idError) throw new Error(idError)
  const reasonError = validateModerationReason(reason)
  if (reasonError) throw new Error(reasonError)

  const { error } = await supabase
    .from('profiles')
    .update({
      account_status: 'active',
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null,
    })
    .eq('id', profileId)

  if (error) throw error

  await insertModerationLog({
    action: 'user_unsuspend',
    targetType: 'profile',
    targetId: profileId,
    reason,
  })
}

/**
 * @param {string} profileId
 * @param {string} reason
 */
export async function deleteUser(profileId, reason) {
  const idError = validateModerationId(profileId)
  if (idError) throw new Error(idError)
  const reasonError = validateModerationReason(reason)
  if (reasonError) throw new Error(reasonError)

  const adminId = await requireAdminSession()
  if (profileId === adminId) {
    throw new Error('No puedes eliminar tu propio perfil de administrador.')
  }

  const { error } = await supabase.from('profiles').delete().eq('id', profileId)
  if (error) throw error

  await insertModerationLog({
    action: 'user_delete',
    targetType: 'profile',
    targetId: profileId,
    reason,
  })
}
