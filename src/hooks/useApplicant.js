import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ensureApplicantProfile,
  fetchApplicantProfile,
  mapAdoptionError,
} from '../services/adoptionApplicationService.js'

/**
 * @param {string | null} userId
 */
export function useApplicant(userId) {
  const [applicant, setApplicant] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(userId))
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!userId) return undefined

    let cancelled = false
    const requestId = ++requestIdRef.current

    const execute = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await fetchApplicantProfile(userId)
        if (cancelled || requestId !== requestIdRef.current) return
        if (fetchError) throw fetchError
        setApplicant(data)
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return
        setApplicant(null)
        setError(mapAdoptionError(err))
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    void execute()

    return () => {
      cancelled = true
    }
  }, [userId])

  const refetch = useCallback(async () => {
    if (!userId) return

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await fetchApplicantProfile(userId)
      if (requestId !== requestIdRef.current) return
      if (fetchError) throw fetchError
      setApplicant(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setApplicant(null)
      setError(mapAdoptionError(err))
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [userId])

  /**
   * @param {{ nombre: string, telefono?: string }} profile
   */
  const ensureProfile = useCallback(
    async (profile) => {
      if (!userId) throw new Error('Debes iniciar sesión.')
      try {
        await ensureApplicantProfile(userId, profile)
        await refetch()
        return true
      } catch (err) {
        setError(mapAdoptionError(err))
        throw err
      }
    },
    [userId, refetch],
  )

  return {
    applicant: userId ? applicant : null,
    isApplicant: Boolean(userId && applicant),
    isLoading: userId ? isLoading : false,
    error: userId ? error : null,
    refetch,
    ensureProfile,
  }
}
