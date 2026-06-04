import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchMyApplications,
  mapAdoptionError,
} from '../services/adoptionApplicationService.js'

/**
 * @param {string | null} userId
 */
export function useMyApplications(userId) {
  const [applications, setApplications] = useState([])
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
        const rows = await fetchMyApplications()
        if (cancelled || requestId !== requestIdRef.current) return
        setApplications(rows)
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return
        setApplications([])
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
      const rows = await fetchMyApplications()
      if (requestId !== requestIdRef.current) return
      setApplications(rows)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setApplications([])
      setError(mapAdoptionError(err))
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [userId])

  return {
    applications: userId ? applications : [],
    isLoading: userId ? isLoading : false,
    error: userId ? error : null,
    refetch,
  }
}
