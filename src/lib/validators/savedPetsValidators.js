/**
 * @param {string | null | undefined} petId
 * @returns {string | null}
 */
export function validatePetIdForSave(petId) {
  if (!petId || typeof petId !== 'string' || !petId.trim()) {
    return 'Identificador de mascota no válido.'
  }
  return null
}
