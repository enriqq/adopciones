import { useState } from 'react'
import Swal from 'sweetalert2'
import { BellRing } from 'lucide-react'
import { createSearchAlert, mapSearchAlertError } from '../../services/searchAlertService.js'
import { validateSearchAlertCriteria } from '../../lib/validators/searchAlertValidators.js'

/**
 * @param {{
 *   filters: object,
 *   userId: string | null,
 * }} props
 */
export default function SearchAlertSaveButton({ filters, userId }) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!userId) {
      await Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Crea una cuenta o inicia sesión para guardar alertas de búsqueda.',
        confirmButtonColor: '#E07A5F',
      })
      return
    }

    const validationError = validateSearchAlertCriteria(filters)
    if (validationError) {
      await Swal.fire({
        icon: 'warning',
        title: 'Criterios incompletos',
        text: validationError,
        confirmButtonColor: '#E07A5F',
      })
      return
    }

    setIsSaving(true)
    try {
      await createSearchAlert(filters)
      await Swal.fire({
        icon: 'success',
        title: 'Alerta guardada',
        text: 'Te avisaremos cuando haya mascotas que coincidan con estos criterios.',
        confirmButtonColor: '#81B29A',
      })
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: mapSearchAlertError(err),
        confirmButtonColor: '#E07A5F',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <button
      type="button"
      disabled={isSaving}
      onClick={() => void handleSave()}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 disabled:opacity-60 transition"
    >
      <BellRing className="w-4 h-4" aria-hidden />
      {isSaving ? 'Guardando…' : 'Guardar alerta de búsqueda'}
    </button>
  )
}
