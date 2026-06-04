import { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import {
  approveApplication,
  fetchRefugeApplications,
  mapSupabaseError,
  rejectApplication,
  sendApplicationMessage,
} from '../services/refugeApplicationService.js'
import {
  validateDecisionMessage,
  validateMessageBody,
} from '../lib/validators/refugeDecisionValidators.js'

/**
 * @param {string | null} refugioId
 */
export function useManageApplications(refugioId) {
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(refugioId))
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [isMutating, setIsMutating] = useState(false)
  const requestIdRef = useRef(0)

  const refetch = useCallback(async () => {
    if (!refugioId) {
      setApplications([])
      setIsLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const rows = await fetchRefugeApplications()
      if (requestId !== requestIdRef.current) return
      setApplications(rows)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setApplications([])
      setError(mapSupabaseError(err))
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [refugioId])

  useEffect(() => {
    if (!refugioId) return undefined

    let cancelled = false
    const requestId = ++requestIdRef.current

    const execute = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const rows = await fetchRefugeApplications()
        if (cancelled || requestId !== requestIdRef.current) return
        setApplications(rows)
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return
        setApplications([])
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
  }, [refugioId])

  const showSuccessFeedback = useCallback(async () => {
    await Swal.fire({
      icon: 'success',
      title: 'Solicitud actualizada',
      text: 'El adoptante verá el cambio en Mis Solicitudes.',
      confirmButtonColor: '#81B29A',
    })
  }, [])

  const showErrorFeedback = useCallback(async (message) => {
    await Swal.fire({
      icon: 'error',
      title: 'No se pudo actualizar',
      text: message,
      confirmButtonColor: '#E07A5F',
    })
  }, [])

  const approve = useCallback(
    async (id, mensaje = '') => {
      const validationError = validateDecisionMessage(mensaje)
      if (validationError) {
        await showErrorFeedback(validationError)
        return
      }

      const { isConfirmed } = await Swal.fire({
        icon: 'question',
        title: '¿Aceptar solicitud?',
        html: '<p class="text-sm text-gray-600">La mascota pasará a <strong>en proceso</strong>.</p>',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#81B29A',
        cancelButtonColor: '#6b7280',
      })

      if (!isConfirmed) return

      setIsMutating(true)
      try {
        await approveApplication(id, mensaje)
        await showSuccessFeedback()
        await refetch()
      } catch (err) {
        await showErrorFeedback(mapSupabaseError(err))
      } finally {
        setIsMutating(false)
      }
    },
    [refetch, showErrorFeedback, showSuccessFeedback],
  )

  const reject = useCallback(
    async (id, mensaje = '') => {
      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Rechazar solicitud?',
        input: 'textarea',
        inputPlaceholder: 'Mensaje opcional para el adoptante…',
        inputAttributes: { maxlength: '1500' },
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#E07A5F',
        cancelButtonColor: '#6b7280',
      })

      if (!result.isConfirmed) return

      const decisionMsg =
        typeof result.value === 'string' ? result.value : mensaje
      const validationError = validateDecisionMessage(decisionMsg)
      if (validationError) {
        await showErrorFeedback(validationError)
        return
      }

      setIsMutating(true)
      try {
        await rejectApplication(id, decisionMsg)
        await showSuccessFeedback()
        await refetch()
      } catch (err) {
        await showErrorFeedback(mapSupabaseError(err))
      } finally {
        setIsMutating(false)
      }
    },
    [refetch, showErrorFeedback, showSuccessFeedback],
  )

  const sendMessage = useCallback(
    async (applicationId, body) => {
      const validationError = validateMessageBody(body)
      if (validationError) {
        await showErrorFeedback(validationError)
        return
      }

      setIsMutating(true)
      try {
        await sendApplicationMessage(applicationId, body, 'refugio')
      } catch (err) {
        await showErrorFeedback(mapSupabaseError(err))
        throw err
      } finally {
        setIsMutating(false)
      }
    },
    [showErrorFeedback],
  )

  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return {
    applications: refugioId ? applications : [],
    isLoading: refugioId ? isLoading : false,
    error: refugioId ? error : null,
    viewMode,
    setViewMode,
    refetch,
    approve,
    reject,
    sendMessage,
    isMutating,
    pendingCount,
  }
}
