import { supabase } from '../lib/supabase.js'
import { mapSupabaseError } from './petService.js'

export { mapSupabaseError }

async function requireSessionUserId() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para ver notificaciones.')
  }

  return session.user.id
}

export async function fetchNotifications() {
  const userId = await requireSessionUserId()

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, message, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function countUnread() {
  const userId = await requireSessionUserId()

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

/**
 * @param {string} id
 */
export async function markAsRead(id) {
  const userId = await requireSessionUserId()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function markAllAsRead() {
  const userId = await requireSessionUserId()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}
