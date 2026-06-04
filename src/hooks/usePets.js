import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  createPet as createPetService,
  createRefugioForUser,
  getRefugioByUserId,
  mapSupabaseError,
} from '../services/petService.js'

/**
 * @typedef {Object} CreatePetInput
 * @property {string} nombre
 * @property {'perro'|'gato'|'otro'} especie
 * @property {string} raza
 * @property {number} edadAnios
 * @property {number} edadMeses
 * @property {string} temperamento
 * @property {string} descripcion
 * @property {File[]} fotos
 * @property {string} vacunas
 * @property {boolean} esterilizado
 * @property {string} [condiciones_especiales]
 * @property {string} [notas_medicas]
 * @property {string} [requisitos_especiales]
 * @property {'pequeno'|'mediano'|'grande'} tamano
 * @property {boolean} [compatibleNinos]
 * @property {boolean} [compatiblePerros]
 * @property {boolean} [compatibleGatos]
 */

export function usePets() {
  const [userId, setUserId] = useState(null)
  const [refugioId, setRefugioId] = useState(null)
  const [refugioNombre, setRefugioNombre] = useState(null)
  const [isLoadingRefugio, setIsLoadingRefugio] = useState(() => Boolean(supabase))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) return undefined

    const syncUser = (session) => {
      setUserId(session?.user?.id ?? null)
    }

    supabase.auth.getSession().then(({ data }) => syncUser(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchRefugio = useCallback(async (uid) => {
    if (!supabase || !uid) {
      return { id: null, nombre: null }
    }

    let { data, error: fetchError } = await getRefugioByUserId(uid)
    if (fetchError) throw fetchError

    if (!data) {
      const created = await createRefugioForUser(uid)
      if (created.error) throw created.error
      data = created.data
    }

    return { id: data.id, nombre: data.nombre }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!userId) {
        setRefugioId(null)
        setRefugioNombre(null)
        setError(null)
        setIsLoadingRefugio(false)
        return
      }

      setIsLoadingRefugio(true)
      setError(null)

      try {
        const result = await fetchRefugio(userId)
        if (cancelled) return
        setRefugioId(result.id)
        setRefugioNombre(result.nombre)
      } catch (err) {
        if (cancelled) return
        setRefugioId(null)
        setRefugioNombre(null)
        setError(mapSupabaseError(err))
      } finally {
        if (!cancelled) setIsLoadingRefugio(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [userId, fetchRefugio])

  /**
   * @param {CreatePetInput} input
   */
  const createPet = useCallback(
    async (input) => {
      if (!userId) {
        const msg = 'Debes iniciar sesión para registrar una mascota.'
        setError(msg)
        throw new Error(msg)
      }
      if (!refugioId) {
        const msg = 'No se encontró un refugio asociado a tu cuenta.'
        setError(msg)
        throw new Error(msg)
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const pet = await createPetService(input, refugioId)
        return pet
      } catch (err) {
        const msg = mapSupabaseError(err)
        setError(msg)
        throw new Error(msg, { cause: err })
      } finally {
        setIsSubmitting(false)
      }
    },
    [userId, refugioId],
  )

  return {
    refugioId,
    refugioNombre,
    isLoadingRefugio,
    isSubmitting,
    createPet,
    error,
    isAuthenticated: !!userId,
  }
}
