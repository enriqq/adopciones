import Swal from 'sweetalert2'

const SWAL_PRIMARY = '#E07A5F'
const SWAL_SECONDARY = '#81B29A'

/**
 * @param {{
 *   title: string,
 *   text: string,
 *   confirmText?: string,
 *   destructive?: boolean,
 * }} options
 * @returns {Promise<{ confirmed: boolean, reason: string }>}
 */
export async function confirmModerationAction({
  title,
  text,
  confirmText = 'Confirmar',
  destructive = true,
}) {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    input: 'textarea',
    inputLabel: 'Motivo (obligatorio)',
    inputPlaceholder: 'Describe el motivo de esta acción…',
    inputAttributes: { maxlength: '500' },
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: destructive ? SWAL_PRIMARY : SWAL_SECONDARY,
    cancelButtonColor: '#6b7280',
    preConfirm: (value) => {
      const trimmed = (value ?? '').trim()
      if (trimmed.length < 10) {
        Swal.showValidationMessage('Indica un motivo entre 10 y 500 caracteres.')
        return false
      }
      if (trimmed.length > 500) {
        Swal.showValidationMessage('Indica un motivo entre 10 y 500 caracteres.')
        return false
      }
      return trimmed
    },
  })

  if (!result.isConfirmed || typeof result.value !== 'string') {
    return { confirmed: false, reason: '' }
  }

  return { confirmed: true, reason: result.value }
}

/**
 * @param {string} message
 */
export async function showModerationSuccess(message) {
  await Swal.fire({
    icon: 'success',
    title: 'Listo',
    text: message,
    confirmButtonColor: SWAL_SECONDARY,
  })
}

/**
 * @param {string} message
 */
export async function showModerationError(message) {
  await Swal.fire({
    icon: 'error',
    title: 'No se pudo completar',
    text: message,
    confirmButtonColor: SWAL_PRIMARY,
  })
}
