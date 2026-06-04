const TIPO_VIVIENDA = ['casa', 'departamento', 'otro']

export const ADOPTION_VALIDATION_MESSAGES = {
  tipo_vivienda: 'Selecciona el tipo de vivienda.',
  horas_solo: 'Indica entre 0 y 24 horas.',
  experiencia_previa: 'Describe tu experiencia (mín. 20 caracteres).',
  otras_mascotas: 'Máximo 500 caracteres.',
}

/**
 * @param {number} step
 * @param {object} state
 */
export function validateAdoptionStep(step, state) {
  /** @type {Record<string, string>} */
  const errors = {}

  if (step === 1 || step === 3) {
    if (!state.tipo_vivienda || !TIPO_VIVIENDA.includes(state.tipo_vivienda)) {
      errors.tipo_vivienda = ADOPTION_VALIDATION_MESSAGES.tipo_vivienda
    }

    const horas = Number.parseInt(String(state.horas_solo), 10)
    if (Number.isNaN(horas) || horas < 0 || horas > 24) {
      errors.horas_solo = ADOPTION_VALIDATION_MESSAGES.horas_solo
    }
  }

  if (step === 2 || step === 3) {
    const experiencia = state.experiencia_previa?.trim() ?? ''
    if (experiencia.length < 20) {
      errors.experiencia_previa = ADOPTION_VALIDATION_MESSAGES.experiencia_previa
    }

    const otras = state.otras_mascotas?.trim() ?? ''
    if (otras.length > 500) {
      errors.otras_mascotas = ADOPTION_VALIDATION_MESSAGES.otras_mascotas
    }
  }

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

export const TIPO_VIVIENDA_LABELS = {
  casa: 'Casa',
  departamento: 'Departamento',
  otro: 'Otro',
}
