import { useCallback, useEffect, useRef, useState } from 'react'
import {
  checkIsShelterOwner,
  fetchReviewsByShelterId,
  getShelterAvgRating,
  mapReviewError,
  submitReview,
} from '../services/reviewService.js'

/**
 * @param {string | null | undefined} shelterId
 * @param {string | null | undefined} userId
 */
export function useShelterReviews(shelterId, userId) {
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({ avg_rating: null, review_count: 0 })
  const [isShelterOwner, setIsShelterOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(shelterId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  const load = useCallback(
    async (signal) => {
      if (!shelterId) return

      const requestId = ++requestIdRef.current
      setIsLoading(true)
      setError(null)

      try {
        const [reviewRows, summaryRow, ownerCheck] = await Promise.all([
          fetchReviewsByShelterId(shelterId, signal),
          getShelterAvgRating(shelterId, signal),
          userId ? checkIsShelterOwner(shelterId, signal) : Promise.resolve(false),
        ])

        if (requestId !== requestIdRef.current) return

        setReviews(reviewRows)
        setSummary(summaryRow)
        setIsShelterOwner(ownerCheck)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        if (err?.name === 'AbortError') return

        setReviews([])
        setSummary({ avg_rating: null, review_count: 0 })
        setIsShelterOwner(false)
        setError(mapReviewError(err))
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    [shelterId, userId],
  )

  useEffect(() => {
    if (!shelterId) return undefined

    const abortController = new AbortController()
    void load(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [shelterId, load])

  const hasUserReviewed = Boolean(
    userId && reviews.some((review) => review.reviewer_id === userId),
  )

  const canShowForm = Boolean(userId && !isShelterOwner && !hasUserReviewed)

  /**
   * @param {{ rating_1_to_5: number, comment: string }} payload
   */
  const submitShelterReview = useCallback(
    async (payload) => {
      if (!shelterId) return

      setIsSubmitting(true)
      setError(null)

      try {
        const newReview = await submitReview({
          shelterId,
          rating_1_to_5: payload.rating_1_to_5,
          comment: payload.comment,
        })

        setReviews((prev) => [newReview, ...prev])

        const refreshed = await getShelterAvgRating(shelterId)
        setSummary(refreshed)

        return newReview
      } catch (err) {
        const message = mapReviewError(err)
        setError(message)
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [shelterId],
  )

  const refetch = useCallback(() => load(), [load])

  return {
    reviews,
    summary,
    isShelterOwner,
    canShowForm,
    hasUserReviewed,
    isLoading: shelterId ? isLoading : false,
    isSubmitting,
    error,
    submitReview: submitShelterReview,
    refetch,
  }
}
