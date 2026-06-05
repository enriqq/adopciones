import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchShelterAvailablePets,
  fetchShelterProfile,
  mapSupabaseError,
} from '../services/shelterProfileService.js'

/**
 * @param {string | null | undefined} shelterId
 */
export function useShelterProfile(shelterId) {
  const [shelter, setShelter] = useState(null)
  const [pets, setPets] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(shelterId))
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const requestIdRef = useRef(0)

  const load = useCallback(async (signal) => {
    if (!shelterId) return

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const [shelterRow, petRows] = await Promise.all([
        fetchShelterProfile(shelterId, signal),
        fetchShelterAvailablePets(shelterId, signal),
      ])

      if (requestId !== requestIdRef.current) return

      if (!shelterRow) {
        setShelter(null)
        setPets([])
        setNotFound(true)
        return
      }

      setShelter(shelterRow)
      setPets(petRows)
      setNotFound(false)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      if (err?.name === 'AbortError') return

      setShelter(null)
      setPets([])
      setNotFound(false)
      setError(mapSupabaseError(err))
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [shelterId])

  useEffect(() => {
    if (!shelterId) return undefined

    const abortController = new AbortController()
    void load(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [shelterId, load])

  const refetch = useCallback(() => load(), [load])

  return {
    shelter,
    pets,
    isLoading: shelterId ? isLoading : false,
    error,
    notFound,
    refetch,
  }
}
