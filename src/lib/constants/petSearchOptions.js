export const EDAD_PRESETS = {
  '': { label: 'Todas las edades', min: null, max: null },
  cachorro: { label: 'Cachorro (0–1 año)', min: 0, max: 1 },
  adulto: { label: 'Adulto (2–7 años)', min: 2, max: 7 },
  senior: { label: 'Senior (8+ años)', min: 8, max: 30 },
}

export const TAMANO_OPTIONS = [
  { value: '', label: 'Todos los tamaños' },
  { value: 'pequeno', label: 'Pequeño' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
]

export const ESPECIE_OPTIONS = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'otro', label: 'Otro' },
]

export const INITIAL_PET_SEARCH_FILTERS = {
  especie: [],
  raza: '',
  edadPreset: '',
  tamano: '',
  ciudad: '',
  estado: '',
  compatibleNinos: false,
  compatiblePerros: false,
  compatibleGatos: false,
}

export const DEBOUNCE_MS = 400
