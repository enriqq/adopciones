import { validatePetIdForSave } from '../lib/validators/savedPetsValidators.js'
import { supabase } from '../lib/supabase.js'
import { normalizeCatalogRow } from './petSearchService.js'
import { mapSupabaseError } from './petService.js'

export { mapSupabaseError }

/**
 * @param {import('@supabase/supabase-js').PostgrestError | Error | null} error
 */
export function mapSavedPetsError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  const code = error.code ?? ''
  const msg = error.message ?? ''

  if (code === '23505') {
    return 'Esta mascota ya está en tus favoritos.'
  }
  if (code === '42501' || msg.includes('row-level security')) {
    return 'No puedes guardar esta mascota (ya no está disponible en adopción).'
  }
  return mapSupabaseError(error)
}

const SELECT_SAVED_PETS = `
  id, pet_id, created_at,
  pets!inner (
    id, nombre, especie, raza, edad, edad_anios, edad_meses, tamano,
    fotos_url,
    compatible_ninos, compatible_perros, compatible_gatos,
    estado_adopcion, refugio_id,
    refugios!inner ( nombre, ciudad, estado )
  )
`

/**
 * @param {object} row
 */
function normalizeSavedPetRow(row) {
  const petRaw = Array.isArray(row.pets) ? row.pets[0] : row.pets
  if (!petRaw) return null
  return normalizeCatalogRow(petRaw)
}

async function requireSessionUserId() {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error('Debes iniciar sesión para gestionar favoritos.')
  }

  return session.user.id
}

export async function fetchSavedPetIds() {
  const userId = await requireSessionUserId()

  const { data, error } = await supabase
    .from('saved_pets')
    .select('pet_id')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).map((row) => row.pet_id)
}

export async function fetchSavedPets() {
  const userId = await requireSessionUserId()

  const { data, error } = await supabase
    .from('saved_pets')
    .select(SELECT_SAVED_PETS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeSavedPetRow).filter(Boolean)
}

/**
 * @param {string} petId
 */
export async function addSavedPet(petId) {
  const validationError = validatePetIdForSave(petId)
  if (validationError) throw new Error(validationError)

  const userId = await requireSessionUserId()

  const { error } = await supabase.from('saved_pets').insert({
    user_id: userId,
    pet_id: petId,
  })

  if (error) throw error
}

/**
 * @param {string} petId
 */
export async function removeSavedPet(petId) {
  const validationError = validatePetIdForSave(petId)
  if (validationError) throw new Error(validationError)

  const userId = await requireSessionUserId()

  const { error } = await supabase
    .from('saved_pets')
    .delete()
    .eq('user_id', userId)
    .eq('pet_id', petId)

  if (error) throw error
}

/**
 * @param {string} petId
 * @param {boolean} isSaved
 */
export async function toggleSavedPet(petId, isSaved) {
  if (isSaved) {
    await removeSavedPet(petId)
  } else {
    await addSavedPet(petId)
  }
}
