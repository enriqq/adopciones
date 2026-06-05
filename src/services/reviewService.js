import { supabase } from '../lib/supabase.js'
import { mapSupabaseError } from './petService.js'

/**
 * @param {import('@supabase/supabase-js').PostgrestError | Error | null} error
 */
export function mapReviewError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  const code = error.code ?? ''
  const msg = error.message ?? ''

  if (code === '23505') {
    return 'Ya has valorado a este refugio.'
  }
  if (code === '23514') {
    return 'La valoración o el comentario no cumplen los requisitos.'
  }
  if (code === '42501' || msg.includes('row-level security')) {
    return 'No puedes valorar tu propio refugio.'
  }
  return mapSupabaseError(error)
}

const SELECT_PUBLIC_REVIEWS = `
  id, reviewer_id, shelter_id, rating_1_to_5, comment, created_at, reviewer_display_name
`

/**
 * @param {object} row
 */
export function normalizeReviewRow(row) {
  return {
    id: row.id,
    reviewer_id: row.reviewer_id,
    shelter_id: row.shelter_id,
    rating_1_to_5: row.rating_1_to_5,
    comment: row.comment,
    created_at: row.created_at,
    reviewer_display_name: row.reviewer_display_name ?? 'Adoptante',
  }
}

/**
 * @param {object | null} data
 */
export function normalizeRatingSummary(data) {
  if (!data || typeof data !== 'object') {
    return { avg_rating: null, review_count: 0 }
  }

  return {
    avg_rating: data.avg_rating != null ? Number(data.avg_rating) : null,
    review_count: data.review_count ?? 0,
  }
}

/**
 * @param {string} shelterId
 * @param {AbortSignal} [signal]
 */
export async function fetchReviewsByShelterId(shelterId, signal) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  let query = supabase
    .from('v_public_reviews')
    .select(SELECT_PUBLIC_REVIEWS)
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(normalizeReviewRow)
}

/**
 * @param {string} shelterId
 * @param {AbortSignal} [signal]
 */
export async function getShelterAvgRating(shelterId, signal) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  let query = supabase.rpc('get_shelter_avg_rating', { p_shelter_id: shelterId })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query
  if (error) throw error

  return normalizeRatingSummary(data)
}

/**
 * @param {string} shelterId
 * @param {AbortSignal} [signal]
 */
export async function checkIsShelterOwner(shelterId, signal) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  let query = supabase.rpc('is_shelter_owner', { p_shelter_id: shelterId })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query
  if (error) throw error

  return Boolean(data)
}

/**
 * @param {{
 *   shelterId: string,
 *   rating_1_to_5: number,
 *   comment: string,
 * }} input
 */
export async function submitReview(input) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para valorar.')
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      shelter_id: input.shelterId,
      reviewer_id: session.user.id,
      rating_1_to_5: input.rating_1_to_5,
      comment: input.comment.trim(),
    })
    .select('id, reviewer_id, shelter_id, rating_1_to_5, comment, created_at')
    .single()

  if (error) throw error

  return {
    ...normalizeReviewRow({
      ...data,
      reviewer_display_name: 'Adoptante',
    }),
    reviewer_display_name:
      session.user.user_metadata?.display_name?.trim() ||
      session.user.email?.split('@')[0] ||
      'Adoptante',
  }
}
