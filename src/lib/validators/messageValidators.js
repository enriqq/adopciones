export { validateMessageBody as validateMessageContent } from './refugeDecisionValidators.js'

/**
 * @param {string | undefined | null} applicationId
 * @returns {string | null}
 */
export function validateApplicationId(applicationId) {
  if (!applicationId || typeof applicationId !== 'string') {
    return 'Solicitud no válida.'
  }
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRe.test(applicationId)) {
    return 'Solicitud no válida.'
  }
  return null
}

/**
 * @param {string | undefined | null} receiverId
 * @param {string} senderId
 * @returns {string | null}
 */
export function validateReceiverId(receiverId, senderId) {
  if (!receiverId || receiverId === senderId) {
    return 'Destinatario no válido.'
  }
  return null
}
