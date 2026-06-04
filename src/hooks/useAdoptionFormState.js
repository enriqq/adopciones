import { useCallback, useReducer } from 'react'
import { validateAdoptionStep } from '../lib/validators/adoptionFormValidators.js'

const INITIAL_STATE = {
  step: 1,
  tipo_vivienda: '',
  tiene_patio: false,
  horas_solo: '',
  experiencia_previa: '',
  otras_mascotas: '',
  errors: {},
  isSubmitting: false,
}

/**
 * @param {typeof INITIAL_STATE} state
 * @param {{ type: string, field?: string, value?: unknown, errors?: Record<string, string>, step?: number }} action
 */
function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD': {
      const nextErrors = { ...state.errors }
      delete nextErrors[action.field]
      return {
        ...state,
        [action.field]: action.value,
        errors: nextErrors,
      }
    }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors ?? {} }
    case 'SET_STEP':
      return { ...state, step: action.step ?? state.step }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true }
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false }
    case 'RESET':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}

export function useAdoptionFormState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const setField = useCallback((field, value) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }, [])

  const validateCurrentStep = useCallback(() => {
    const result = validateAdoptionStep(state.step, state)
    if (!result.valid) {
      dispatch({ type: 'SET_ERRORS', errors: result.errors })
    }
    return result
  }, [state])

  const goNext = useCallback(() => {
    const result = validateAdoptionStep(state.step, state)
    if (!result.valid) {
      dispatch({ type: 'SET_ERRORS', errors: result.errors })
      return false
    }
    if (state.step < 3) {
      dispatch({ type: 'SET_STEP', step: state.step + 1 })
    }
    return true
  }, [state])

  const goPrev = useCallback(() => {
    if (state.step > 1) {
      dispatch({ type: 'SET_STEP', step: state.step - 1 })
    }
  }, [state.step])

  const validateAll = useCallback(() => {
    const result = validateAdoptionStep(3, state)
    if (!result.valid) {
      dispatch({ type: 'SET_ERRORS', errors: result.errors })
    }
    return result
  }, [state])

  const startSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT_START' })
  }, [])

  const endSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT_END' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return {
    state,
    setField,
    goNext,
    goPrev,
    validateCurrentStep,
    validateAll,
    startSubmit,
    endSubmit,
    reset,
  }
}
