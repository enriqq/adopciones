import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { fetchProfileByUserId, mapSupabaseError } from '../services/profileService.js'

/**
 * @param {string | null | undefined} userId
 */
export function useProfile(userId) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!supabase)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [error, setError] = useState(null)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const row = await fetchProfileByUserId(uid)
      setProfile(row)
    } catch (err) {
      setProfile(null)
      setError(mapSupabaseError(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      setIsLoading(false)
      return undefined
    }

    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setAuthReady(true)
    }

    void initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setAuthReady(true)

      const uid = newSession?.user?.id
      if (
        uid &&
        (event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION')
      ) {
        void loadProfile(uid)
      }
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  useEffect(() => {
    if (!authReady) return
    const uid = userId ?? session?.user?.id ?? null
    void loadProfile(uid)
  }, [userId, session?.user?.id, authReady, loadProfile])

  useEffect(() => {
    if (!authReady) return undefined

    const onFocus = () => {
      const uid = userId ?? session?.user?.id ?? null
      if (uid) void loadProfile(uid)
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [userId, session?.user?.id, authReady, loadProfile])

  const isAdmin = profile?.system_role === 'admin'

  const refetch = useCallback(() => {
    const uid = userId ?? session?.user?.id ?? null
    return loadProfile(uid)
  }, [userId, session?.user?.id, loadProfile])

  return {
    session,
    profile,
    systemRole: profile?.system_role ?? null,
    accountStatus: profile?.account_status ?? null,
    isAdmin,
    isLoading: !authReady || isLoading,
    authReady,
    error,
    refetch,
  }
}
