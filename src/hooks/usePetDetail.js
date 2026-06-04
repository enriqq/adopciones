import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPetDetail } from '../services/petDetailService.js'
import { mapSupabaseError } from '../services/petService.js'

/**
 * @param {string | null} petId
 */
export function usePetDetail(petId) {
  const [pet, setPet] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(petId))
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!petId) return undefined

    const abortController = new AbortController()
    let cancelled = false
    const requestId = ++requestIdRef.current

    const execute = async () => {
      setIsLoading(true)
      setError(null)
      setNotFound(false)
      setPet(null)

      try {
        const result = await fetchPetDetail(petId, abortController.signal)
        if (cancelled || requestId !== requestIdRef.current) return

        if (!result) {
          setPet(null)
          setNotFound(true)
          return
        }

        setPet(result)
        setNotFound(false)
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return
        if (err?.name === 'AbortError') return

        setPet(null)
        setNotFound(false)
        setError(mapSupabaseError(err))
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    void execute()

    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [petId])

  const refetch = useCallback(async () => {
    if (!petId) return

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const result = await fetchPetDetail(petId)
      if (requestId !== requestIdRef.current) return

      if (!result) {
        setPet(null)
        setNotFound(true)
        return
      }

      setPet(result)
      setNotFound(false)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setPet(null)
      setNotFound(false)
      setError(mapSupabaseError(err))
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [petId])

  return {
    pet,
    isLoading: petId ? isLoading : false,
    error,
    notFound,
    refetch,
  }
}
