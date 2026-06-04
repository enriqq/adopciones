import { formatEdad } from '../lib/validators/petFormValidators.js'
import { supabase } from '../lib/supabase.js'

const BUCKET = 'pet-photos'

export function mapSupabaseError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  const code = error.code ?? ''
  const msg = error.message ?? ''

  if (code === '42501' || msg.includes('row-level security')) {
    return 'No tienes permiso para registrar mascotas en este refugio.'
  }
  if (code === '23514') return 'Los datos no cumplen las reglas de la base de datos.'
  if (msg.includes('JWT') || msg.includes('session')) {
    return 'Debes iniciar sesión para continuar.'
  }
  return msg || 'No se pudo completar la operación.'
}

/**
 * @param {File[]} files
 * @param {string} refugioId
 * @param {string} petId
 */
export async function uploadPetPhotos(files, refugioId, petId) {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')

  const urls = []
  const paths = []

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${refugioId}/${petId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      await removeStoragePaths(paths)
      throw uploadError
    }

    paths.push(path)
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    if (data?.publicUrl) urls.push(data.publicUrl)
  }

  return { urls, paths, petId }
}

async function removeStoragePaths(paths) {
  if (!supabase || !paths.length) return
  await supabase.storage.from(BUCKET).remove(paths)
}

/**
 * @param {object} input
 * @param {string} input.refugioId
 */
export async function insertPetRecord(input) {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')

  const { data, error } = await supabase
    .from('pets')
    .insert({
      nombre: input.nombre.trim(),
      especie: input.especie,
      raza: input.raza.trim(),
      edad: input.edad,
      edad_anios: input.edadAnios,
      edad_meses: input.edadMeses,
      tamano: input.tamano,
      temperamento: input.temperamento.trim(),
      descripcion: input.descripcion.trim(),
      fotos_url: input.fotos_url,
      compatible_ninos: input.compatibleNinos,
      compatible_perros: input.compatiblePerros,
      compatible_gatos: input.compatibleGatos,
      requisitos_especiales: input.requisitos_especiales?.trim() ?? '',
      estado_adopcion: 'disponible',
      refugio_id: input.refugioId,
    })
    .select()
    .single()

  if (error) throw error
  return normalizePetRow(data)
}

/**
 * @param {object} input
 */
export async function insertMedicalRecord(input) {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.')

  const { error } = await supabase.from('medical_records').insert({
    pet_id: input.petId,
    vacunas: input.vacunas.trim(),
    esterilizado: Boolean(input.esterilizado),
    condiciones_especiales: input.condiciones_especiales?.trim() ?? '',
    notas_medicas: input.notas_medicas?.trim() ?? '',
  })

  if (error) throw error
}

async function deletePetById(petId) {
  if (!supabase || !petId) return
  await supabase.from('pets').delete().eq('id', petId)
}

export function normalizePetRow(row) {
  const fotos = Array.isArray(row.fotos_url)
    ? row.fotos_url
    : typeof row.fotos_url === 'string'
      ? JSON.parse(row.fotos_url)
      : []

  return {
    id: row.id,
    nombre: row.nombre,
    especie: row.especie,
    raza: row.raza,
    edad: row.edad,
    temperamento: row.temperamento,
    descripcion: row.descripcion,
    fotos_url: fotos,
    refugio_id: row.refugio_id,
    created_at: row.created_at,
  }
}

/**
 * @param {import('../hooks/usePets.js').CreatePetInput} input
 * @param {string} refugioId
 */
export async function createPet(input, refugioId) {
  const edad = formatEdad(input.edadAnios, input.edadMeses)
  if (edad.trim().length < 2) {
    throw new Error('Indica la edad de la mascota.')
  }

  const petId = crypto.randomUUID()
  const { urls, paths } = await uploadPetPhotos(input.fotos, refugioId, petId)

  try {
    const pet = await insertPetRecord({
      nombre: input.nombre,
      especie: input.especie,
      raza: input.raza,
      edad,
      edadAnios: Number.parseInt(String(input.edadAnios), 10) || 0,
      edadMeses: Number.parseInt(String(input.edadMeses), 10) || 0,
      tamano: input.tamano,
      temperamento: input.temperamento,
      descripcion: input.descripcion,
      fotos_url: urls,
      compatibleNinos: Boolean(input.compatibleNinos),
      compatiblePerros: Boolean(input.compatiblePerros),
      compatibleGatos: Boolean(input.compatibleGatos),
      requisitos_especiales: input.requisitos_especiales,
      refugioId,
    })

    try {
      await insertMedicalRecord({
        petId: pet.id,
        vacunas: input.vacunas,
        esterilizado: input.esterilizado,
        condiciones_especiales: input.condiciones_especiales,
        notas_medicas: input.notas_medicas,
      })
    } catch (medicalErr) {
      await deletePetById(pet.id)
      throw medicalErr
    }

    return pet
  } catch (err) {
    await removeStoragePaths(paths)
    throw err
  }
}

export async function getRefugioByUserId(userId) {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') }

  const { data, error } = await supabase
    .from('refugios')
    .select('id, nombre, user_id')
    .eq('user_id', userId)
    .maybeSingle()

  return { data, error }
}

export async function createRefugioForUser(
  userId,
  nombre = 'Mi refugio',
  ciudad = 'Sin especificar',
  estado = 'Sin especificar',
) {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') }

  const { data, error } = await supabase
    .from('refugios')
    .insert({
      user_id: userId,
      nombre,
      ciudad: ciudad.trim(),
      estado: estado.trim(),
    })
    .select('id, nombre, user_id, ciudad, estado')
    .single()

  return { data, error }
}
