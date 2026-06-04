import { useCallback, useEffect, useState } from 'react'
import {
  approvePet,
  deletePet,
  deleteUser,
  fetchAdminPets,
  fetchAdminUsers,
  mapSupabaseError,
  suspendPet,
  suspendUser,
  unsuspendUser,
} from '../services/adminModerationService.js'

/**
 * @param {{ enabled?: boolean }} [options]
 */
export function useAdminModeration(options = {}) {
  const { enabled = true } = options

  const [pets, setPets] = useState([])
  const [users, setUsers] = useState([])
  const [petFilters, setPetFilters] = useState({ status: 'all', search: '' })
  const [userFilters, setUserFilters] = useState({
    status: 'all',
    role: 'all',
    search: '',
  })
  const [isLoadingPets, setIsLoadingPets] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState(null)

  const refetchPets = useCallback(async () => {
    if (!enabled) return
    setIsLoadingPets(true)
    setError(null)
    try {
      const rows = await fetchAdminPets(petFilters)
      setPets(rows)
    } catch (err) {
      setPets([])
      setError(mapSupabaseError(err))
    } finally {
      setIsLoadingPets(false)
    }
  }, [enabled, petFilters])

  const refetchUsers = useCallback(async () => {
    if (!enabled) return
    setIsLoadingUsers(true)
    setError(null)
    try {
      const rows = await fetchAdminUsers(userFilters)
      setUsers(rows)
    } catch (err) {
      setUsers([])
      setError(mapSupabaseError(err))
    } finally {
      setIsLoadingUsers(false)
    }
  }, [enabled, userFilters])

  useEffect(() => {
    void refetchPets()
  }, [refetchPets])

  useEffect(() => {
    void refetchUsers()
  }, [refetchUsers])

  const runMutation = useCallback(async (fn) => {
    setIsMutating(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      const message = mapSupabaseError(err)
      setError(message)
      throw err
    } finally {
      setIsMutating(false)
    }
  }, [])

  const handleApprovePet = useCallback(
    async (petId, reason) => {
      await runMutation(async () => {
        await approvePet(petId, reason)
        await refetchPets()
      })
    },
    [runMutation, refetchPets],
  )

  const handleSuspendPet = useCallback(
    async (petId, reason) => {
      await runMutation(async () => {
        await suspendPet(petId, reason)
        await refetchPets()
      })
    },
    [runMutation, refetchPets],
  )

  const handleDeletePet = useCallback(
    async (petId, reason) => {
      await runMutation(async () => {
        await deletePet(petId, reason)
        await refetchPets()
      })
    },
    [runMutation, refetchPets],
  )

  const handleSuspendUser = useCallback(
    async (profileId, reason) => {
      await runMutation(async () => {
        await suspendUser(profileId, reason)
        await refetchUsers()
      })
    },
    [runMutation, refetchUsers],
  )

  const handleUnsuspendUser = useCallback(
    async (profileId, reason) => {
      await runMutation(async () => {
        await unsuspendUser(profileId, reason)
        await refetchUsers()
      })
    },
    [runMutation, refetchUsers],
  )

  const handleDeleteUser = useCallback(
    async (profileId, reason) => {
      await runMutation(async () => {
        await deleteUser(profileId, reason)
        await refetchUsers()
      })
    },
    [runMutation, refetchUsers],
  )

  return {
    pets,
    users,
    petFilters,
    setPetFilters,
    userFilters,
    setUserFilters,
    isLoadingPets,
    isLoadingUsers,
    isMutating,
    error,
    refetchPets,
    refetchUsers,
    approvePet: handleApprovePet,
    suspendPet: handleSuspendPet,
    deletePet: handleDeletePet,
    suspendUser: handleSuspendUser,
    unsuspendUser: handleUnsuspendUser,
    deleteUser: handleDeleteUser,
  }
}
