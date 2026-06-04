const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * @param {string | undefined | null} reason
 * @returns {string | null}
 */
export function validateModerationReason(reason) {
  const trimmed = (reason ?? '').trim()
  if (trimmed.length < 10) {
    return 'Indica un motivo entre 10 y 500 caracteres.'
  }
  if (trimmed.length > 500) {
    return 'Indica un motivo entre 10 y 500 caracteres.'
  }
  return null
}

/**
 * @param {string | undefined | null} id
 * @returns {string | null}
 */
export function validateModerationId(id) {
  if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
    return 'Identificador no válido.'
  }
  return null
}

/** @param {string | undefined | null} profileId */
export const validateProfileId = validateModerationId

/** @param {string | undefined | null} petId */
export const validatePetId = validateModerationId
