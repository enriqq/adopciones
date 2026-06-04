import { supabase } from '../lib/supabase.js'
import { mapSupabaseError } from './petService.js'

export { mapSupabaseError }

/**
 * @param {string | undefined | null} name
 * @param {string | undefined | null} email
 */
function normalizeDisplayName(name, email) {
  const raw = (name?.trim() || email?.split('@')[0] || 'Usuario').trim()
  return raw.length >= 2 ? raw : 'Usuario'
}

/**
 * @param {string} userId
 * @param {{ email?: string | null, displayName?: string }} [options]
 */
export async function ensureProfile(userId, options = {}) {
  if (!supabase || !userId) return null

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, system_role, display_name, email, account_status')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return existing

  const displayName = normalizeDisplayName(options.displayName, options.email)

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name: displayName,
      email: options.email ?? null,
      system_role: 'user',
    })
    .select('id, system_role, display_name, email, account_status')
    .single()

  if (error) throw error
  return data
}

/**
 * @param {string | null} userId
 */
export async function fetchProfileByUserId(userId) {
  if (!supabase || !userId) return null

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user || session.user.id !== userId) {
    return null
  }

  let { data, error } = await supabase
    .from('profiles')
    .select('id, system_role, display_name, email, account_status')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const created = await ensureProfile(userId, {
      email: session.user.email,
      displayName: session.user.user_metadata?.display_name,
    })
    if (created) return created

    const { data: retry, error: retryError } = await supabase
      .from('profiles')
      .select('id, system_role, display_name, email, account_status')
      .eq('id', userId)
      .maybeSingle()

    if (retryError) throw retryError
    return retry
  }

  return data
}

/** Perfil del usuario en sesión (contrato FEAT-009). */
export async function fetchCurrentProfile() {
  if (!supabase) return null

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id
  if (!userId) return null

  return fetchProfileByUserId(userId)
}
