import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEBOUNCE_MS,
  INITIAL_PET_SEARCH_FILTERS,
} from '../lib/constants/petSearchOptions.js'
import { searchPets } from '../services/petSearchService.js'
import { mapSupabaseError } from '../services/petService.js'
import { useDebouncedValue } from './useDebouncedValue.js'

export function usePetsSearch() {
  const [filters, setFilters] = useState(INITIAL_PET_SEARCH_FILTERS)
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  const debouncedRaza = useDebouncedValue(filters.raza, DEBOUNCE_MS)
  const debouncedCiudad = useDebouncedValue(filters.ciudad, DEBOUNCE_MS)
  const debouncedEstado = useDebouncedValue(filters.estado, DEBOUNCE_MS)

  const queryFilters = useMemo(
    () => ({
      especie: filters.especie,
      raza: debouncedRaza,
      edadPreset: filters.edadPreset,
      tamano: filters.tamano,
      ciudad: debouncedCiudad,
      estado: debouncedEstado,
      compatibleNinos: filters.compatibleNinos,
      compatiblePerros: filters.compatiblePerros,
      compatibleGatos: filters.compatibleGatos,
    }),
    [
      filters.especie,
      filters.edadPreset,
      filters.tamano,
      filters.compatibleNinos,
      filters.compatiblePerros,
      filters.compatibleGatos,
      debouncedRaza,
      debouncedCiudad,
      debouncedEstado,
    ],
  )

  useEffect(() => {
    const abortController = new AbortController()
    let cancelled = false
    const id = ++requestIdRef.current

    const execute = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const rows = await searchPets(queryFilters, abortController.signal)
        if (cancelled || id !== requestIdRef.current) return
        setResults(rows)
      } catch (err) {
        if (cancelled || id !== requestIdRef.current) return
        if (err?.name === 'AbortError') return
        setResults([])
        setError(mapSupabaseError(err))
      } finally {
        if (!cancelled && id === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    void execute()

    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [queryFilters])

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_PET_SEARCH_FILTERS)
  }, [])

  const refetch = useCallback(async () => {
    const id = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const rows = await searchPets(queryFilters)
      if (id !== requestIdRef.current) return
      setResults(rows)
    } catch (err) {
      if (id !== requestIdRef.current) return
      setResults([])
      setError(mapSupabaseError(err))
    } finally {
      if (id === requestIdRef.current) setIsLoading(false)
    }
  }, [queryFilters])

  return {
    filters,
    setFilters,
    results,
    isLoading,
    error,
    clearFilters,
    refetch,
  }
}
