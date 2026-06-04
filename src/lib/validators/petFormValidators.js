const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SPECIES = ['perro', 'gato', 'otro']

export const VALIDATION_MESSAGES = {
  nombre: 'El nombre de la mascota es obligatorio.',
  especie: 'Selecciona la especie (perro, gato u otro).',
  raza: 'La raza es obligatoria.',
  edad: 'Indica la edad de la mascota.',
  temperamento: 'Describe el temperamento (mínimo 3 caracteres).',
  descripcion: 'La descripción debe tener al menos 20 caracteres.',
  fotos: 'Agrega entre 1 y 5 fotos válidas (máx. 5 MB cada una).',
  tamano: 'Selecciona el tamaño de la mascota.',
  descripcionMax: 'La descripción no puede superar 2000 caracteres.',
  razaMax: 'La raza no puede superar 100 caracteres.',
  temperamentoMax: 'El temperamento no puede superar 500 caracteres.',
  vacunas: 'Indica el estado de vacunación.',
  condicionesMax: 'Las condiciones no pueden superar 1500 caracteres.',
  notasMax: 'Las notas no pueden superar 3000 caracteres.',
  requisitosMax: 'Los requisitos no pueden superar 1500 caracteres.',
}

export function formatEdad(edadAnios, edadMeses) {
  const anios = Number.parseInt(String(edadAnios), 10) || 0
  const meses = Number.parseInt(String(edadMeses), 10) || 0
  const parts = []
  if (anios > 0) parts.push(`${anios} ${anios === 1 ? 'año' : 'años'}`)
  if (meses > 0) parts.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`)
  return parts.join(', ')
}

function validateFotos(fotos) {
  if (!fotos?.length) return VALIDATION_MESSAGES.fotos
  if (fotos.length > 5) return VALIDATION_MESSAGES.fotos
  for (const file of fotos) {
    if (!ALLOWED_TYPES.includes(file.type)) return VALIDATION_MESSAGES.fotos
    if (file.size > MAX_FILE_SIZE) return VALIDATION_MESSAGES.fotos
  }
  return null
}

/**
 * @param {{
 *   nombre: string,
 *   especie: string,
 *   raza: string,
 *   edadAnios: string|number,
 *   edadMeses: string|number,
 *   temperamento: string,
 *   descripcion: string,
 *   fotos: File[],
 *   vacunas: string,
 *   esterilizado: boolean,
 *   condiciones_especiales: string,
 *   notas_medicas: string,
 *   requisitos_especiales: string,
 * }} state
 */
export function validatePetForm(state) {
  /** @type {Record<string, string>} */
  const errors = {}

  const nombre = state.nombre?.trim() ?? ''
  if (!nombre || nombre.length > 80) errors.nombre = VALIDATION_MESSAGES.nombre

  if (!state.especie || !SPECIES.includes(state.especie)) {
    errors.especie = VALIDATION_MESSAGES.especie
  }

  const raza = state.raza?.trim() ?? ''
  if (!raza) errors.raza = VALIDATION_MESSAGES.raza
  else if (raza.length > 100) errors.raza = VALIDATION_MESSAGES.razaMax

  const anios = Number.parseInt(String(state.edadAnios), 10) || 0
  const meses = Number.parseInt(String(state.edadMeses), 10) || 0
  if (anios <= 0 && meses <= 0) errors.edad = VALIDATION_MESSAGES.edad
  else if (anios > 30 || meses > 11 || meses < 0 || anios < 0) {
    errors.edad = VALIDATION_MESSAGES.edad
  }

  const temperamento = state.temperamento?.trim() ?? ''
  if (temperamento.length < 3) errors.temperamento = VALIDATION_MESSAGES.temperamento
  else if (temperamento.length > 500) {
    errors.temperamento = VALIDATION_MESSAGES.temperamentoMax
  }

  const descripcion = state.descripcion?.trim() ?? ''
  if (descripcion.length < 20) errors.descripcion = VALIDATION_MESSAGES.descripcion
  else if (descripcion.length > 2000) {
    errors.descripcion = VALIDATION_MESSAGES.descripcionMax
  }

  const fotosError = validateFotos(state.fotos)
  if (fotosError) errors.fotos = fotosError

  const tamanoValid = ['pequeno', 'mediano', 'grande']
  if (!state.tamano || !tamanoValid.includes(state.tamano)) {
    errors.tamano = VALIDATION_MESSAGES.tamano
  }

  const vacunas = state.vacunas?.trim() ?? ''
  if (vacunas.length < 2) errors.vacunas = VALIDATION_MESSAGES.vacunas

  const condiciones = state.condiciones_especiales?.trim() ?? ''
  if (condiciones.length > 1500) errors.condiciones_especiales = VALIDATION_MESSAGES.condicionesMax

  const notas = state.notas_medicas?.trim() ?? ''
  if (notas.length > 3000) errors.notas_medicas = VALIDATION_MESSAGES.notasMax

  const requisitos = state.requisitos_especiales?.trim() ?? ''
  if (requisitos.length > 1500) errors.requisitos_especiales = VALIDATION_MESSAGES.requisitosMax

  const messages = Object.values(errors)
  return {
    valid: messages.length === 0,
    errors,
    messages,
  }
}

export function errorsToSwalHtml(messages) {
  if (!messages.length) return ''
  return `<ul style="text-align:left;margin:0;padding-left:1.25rem;">${messages
    .map((m) => `<li>${m}</li>`)
    .join('')}</ul>`
}

/**
 * Combina fotos existentes con nuevas selecciones (máx. 5).
 * @param {File[]} current
 * @param {FileList|File[]} incoming
 */
export function mergePhotoFiles(current, incoming) {
  const added = Array.from(incoming ?? [])
  const merged = [...current, ...added]
  return merged.slice(0, 5)
}
