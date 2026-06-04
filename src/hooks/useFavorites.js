import { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import {
  fetchSavedPetIds,
  fetchSavedPets,
  mapSavedPetsError,
  toggleSavedPet,
} from '../services/savedPetsService.js'

/**
 * @param {string | null} userId
 */
export function useFavorites(userId) {
  const [savedPetIds, setSavedPetIds] = useState(() => new Set())
  const [savedPets, setSavedPets] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(userId))
  const [error, setError] = useState(null)
  const [isMutating, setIsMutating] = useState(false)
  const requestIdRef = useRef(0)

  const refetch = useCallback(async () => {
    if (!userId) {
      setSavedPetIds(new Set())
      setSavedPets([])
      setIsLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const [ids, pets] = await Promise.all([fetchSavedPetIds(), fetchSavedPets()])
      if (requestId !== requestIdRef.current) return
      setSavedPetIds(new Set(ids))
      setSavedPets(pets)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setSavedPetIds(new Set())
      setSavedPets([])
      setError(mapSavedPetsError(err))
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return undefined

    let cancelled = false
    const requestId = ++requestIdRef.current

    const execute = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [ids, pets] = await Promise.all([fetchSavedPetIds(), fetchSavedPets()])
        if (cancelled || requestId !== requestIdRef.current) return
        setSavedPetIds(new Set(ids))
        setSavedPets(pets)
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return
        setSavedPetIds(new Set())
        setSavedPets([])
        setError(mapSavedPetsError(err))
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

  const isFavorite = useCallback(
    (petId) => savedPetIds.has(petId),
    [savedPetIds],
  )

  const toggleFavorite = useCallback(
    async (petId) => {
      if (!userId) {
        await Swal.fire({
          icon: 'info',
          title: 'Inicia sesión',
          text: 'Crea una cuenta o inicia sesión para guardar favoritos.',
          confirmButtonColor: '#E07A5F',
        })
        return
      }

      const wasSaved = savedPetIds.has(petId)
      setIsMutating(true)

      try {
        await toggleSavedPet(petId, wasSaved)
        await refetch()
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: mapSavedPetsError(err),
          confirmButtonColor: '#E07A5F',
        })
      } finally {
        setIsMutating(false)
      }
    },
    [userId, savedPetIds, refetch],
  )

  const count = savedPetIds.size

  return {
    savedPetIds: userId ? savedPetIds : new Set(),
    savedPets: userId ? savedPets : [],
    isLoading: userId ? isLoading : false,
    error: userId ? error : null,
    isMutating,
    isFavorite,
    toggleFavorite,
    refetch,
    count,
  }
}
