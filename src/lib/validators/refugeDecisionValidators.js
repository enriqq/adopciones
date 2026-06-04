/**
 * @param {string | undefined | null} mensaje
 * @returns {string | null}
 */
export function validateDecisionMessage(mensaje) {
  if (mensaje == null || mensaje === '') return null
  if (mensaje.length > 1500) {
    return 'El mensaje no puede superar 1500 caracteres.'
  }
  return null
}

/**
 * @param {string} body
 * @returns {string | null}
 */
export function validateMessageBody(body) {
  const trimmed = body.trim()
  if (trimmed.length < 2) {
    return 'Escribe un mensaje de al menos 2 caracteres.'
  }
  if (body.length > 2000) {
    return 'El mensaje no puede superar 2000 caracteres.'
  }
  return null
}
