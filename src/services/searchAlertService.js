import { normalizeCriteriaJson } from '../lib/searchFilterUtils.js'
import {
  mapSearchAlertError,
  validateSearchAlertCriteria,
} from '../lib/validators/searchAlertValidators.js'
import { supabase } from '../lib/supabase.js'

export { mapSearchAlertError }

async function requireSessionUserId() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para guardar alertas de búsqueda.')
  }

  return session.user.id
}

export async function fetchSearchAlerts() {
  const userId = await requireSessionUserId()

  const { data, error } = await supabase
    .from('search_alerts')
    .select('id, user_id, criteria_json')
    .eq('user_id', userId)
    .order('id', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * @param {object} criteria
 */
export async function createSearchAlert(criteria) {
  const validationError = validateSearchAlertCriteria(criteria)
  if (validationError) throw new Error(validationError)

  const userId = await requireSessionUserId()
  const criteria_json = normalizeCriteriaJson(criteria)

  const { error } = await supabase.from('search_alerts').insert({
    user_id: userId,
    criteria_json,
  })

  if (error) throw error
}

/**
 * @param {string} id
 */
export async function deleteSearchAlert(id) {
  const userId = await requireSessionUserId()

  const { error } = await supabase
    .from('search_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
