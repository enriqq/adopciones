import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchNotifications,
  markAllAsRead as markAllAsReadService,
  markAsRead as markAsReadService,
} from '../services/notificationService.js'
import { mapSupabaseError } from '../services/petService.js'

/**
 * @param {string | null} userId
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(userId))
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  const refetch = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const rows = await fetchNotifications()
      if (requestId !== requestIdRef.current) return
      setNotifications(rows)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setNotifications([])
      setError(mapSupabaseError(err))
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
        const rows = await fetchNotifications()
        if (cancelled || requestId !== requestIdRef.current) return
        setNotifications(rows)
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return
        setNotifications([])
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
    }
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = useCallback(
    async (id) => {
      if (!userId) return

      try {
        await markAsReadService(id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        )
      } catch (err) {
        setError(mapSupabaseError(err))
      }
    },
    [userId],
  )

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    try {
      await markAllAsReadService()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      setError(mapSupabaseError(err))
    }
  }, [userId])

  return {
    notifications: userId ? notifications : [],
    unreadCount: userId ? unreadCount : 0,
    isLoading: userId ? isLoading : false,
    error: userId ? error : null,
    markAsRead,
    markAllAsRead,
    refetch,
  }
}
