import { useCallback, useState } from 'react'
import {
  createApplication,
  mapAdoptionError,
} from '../services/adoptionApplicationService.js'

/**
 * @param {string | null} applicantId
 */
export function useSubmitAdoptionApplication(applicantId) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submit = useCallback(
    async (input) => {
      if (!applicantId) {
        const msg = 'Debes iniciar sesión como adoptante para solicitar.'
        setError(msg)
        throw new Error(msg)
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const row = await createApplication(input, applicantId)
        return row
      } catch (err) {
        const msg = mapAdoptionError(err)
        setError(msg)
        throw new Error(msg, { cause: err })
      } finally {
        setIsSubmitting(false)
      }
    },
    [applicantId],
  )

  return { submit, isSubmitting, error }
}
