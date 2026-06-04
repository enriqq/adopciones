import { useState } from 'react'
import Swal from 'sweetalert2'
import { AlertCircle, AlertTriangle, Loader2, PawPrint, Save, Stethoscope } from 'lucide-react'
import { usePets } from '../../hooks/usePets.js'
import {
  errorsToSwalHtml,
  validatePetForm,
} from '../../lib/validators/petFormValidators.js'
import PhotoUploader from './PhotoUploader.jsx'

const INITIAL_STATE = {
  nombre: '',
  especie: '',
  raza: '',
  edadAnios: '',
  edadMeses: '',
  tamano: '',
  temperamento: '',
  descripcion: '',
  compatibleNinos: false,
  compatiblePerros: false,
  compatibleGatos: false,
  vacunas: '',
  esterilizado: false,
  condiciones_especiales: '',
  notas_medicas: '',
  requisitos_especiales: '',
  fotos: [],
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition'

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="text-red-600 text-xs mt-1 flex items-center gap-1" role="alert">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

/**
 * @param {{
 *   onSuccess?: (pet: object) => void,
 *   className?: string,
 * }} props
 */
export default function PetProfileForm({ onSuccess, className = '' }) {
  const {
    refugioId,
    refugioNombre,
    isLoadingRefugio,
    isSubmitting,
    createPet,
    error: hookError,
  } = usePets()

  const [form, setForm] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [previews, setPreviews] = useState([])

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const revokePreviews = (items) => {
    items.forEach((p) => URL.revokeObjectURL(p.url))
  }

  const resetForm = () => {
    revokePreviews(previews)
    setForm(INITIAL_STATE)
    setErrors({})
    setPreviews([])
  }

  const handlePhotosChange = (files, nextPreviews) => {
    update('fotos', files)
    setPreviews(nextPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const result = validatePetForm(form)
    setErrors(result.errors)

    if (!result.valid) {
      await Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        html: errorsToSwalHtml(result.messages),
        confirmButtonColor: '#E07A5F',
      })
      return
    }

    if (!refugioId) {
      await Swal.fire({
        icon: 'error',
        title: 'Refugio no disponible',
        text: 'Inicia sesión y espera a que se cargue tu refugio.',
        confirmButtonColor: '#E07A5F',
      })
      return
    }

    try {
      const pet = await createPet({
        nombre: form.nombre.trim(),
        especie: form.especie,
        raza: form.raza.trim(),
        edadAnios: Number.parseInt(String(form.edadAnios), 10) || 0,
        edadMeses: Number.parseInt(String(form.edadMeses), 10) || 0,
        tamano: form.tamano,
        temperamento: form.temperamento.trim(),
        descripcion: form.descripcion.trim(),
        compatibleNinos: form.compatibleNinos,
        compatiblePerros: form.compatiblePerros,
        compatibleGatos: form.compatibleGatos,
        vacunas: form.vacunas.trim(),
        esterilizado: form.esterilizado,
        condiciones_especiales: form.condiciones_especiales.trim(),
        notas_medicas: form.notas_medicas.trim(),
        requisitos_especiales: form.requisitos_especiales.trim(),
        fotos: form.fotos,
      })

      await Swal.fire({
        icon: 'success',
        title: '¡Mascota publicada!',
        text: `${pet.nombre} ya está disponible para posibles adoptantes.`,
        confirmButtonColor: '#81B29A',
      })

      resetForm()
      onSuccess?.(pet)
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: err.message ?? 'Revisa tu conexión e intenta de nuevo.',
        confirmButtonColor: '#E07A5F',
      })
    }
  }

  const formDisabled = isLoadingRefugio || !refugioId

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-5 ${className}`}
      noValidate
    >
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <PawPrint className="w-7 h-7" aria-hidden />
        </div>
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Registrar mascota</h2>
          <p className="text-sm text-gray-600">
            Perfil para adopción con fotos y datos completos
            {refugioNombre && (
              <>
                {' '}
                · <span className="text-secondary font-medium">{refugioNombre}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {hookError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg py-2 px-3">{hookError}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nombre" className="text-sm font-medium text-gray-700">
            Nombre *
          </label>
          <input
            id="nombre"
            type="text"
            className={inputClass}
            value={form.nombre}
            onChange={(e) => update('nombre', e.target.value)}
            aria-invalid={!!errors.nombre}
            maxLength={80}
            disabled={formDisabled}
          />
          <FieldError message={errors.nombre} />
        </div>

        <div>
          <label htmlFor="especie" className="text-sm font-medium text-gray-700">
            Especie *
          </label>
          <select
            id="especie"
            className={inputClass}
            value={form.especie}
            onChange={(e) => update('especie', e.target.value)}
            aria-invalid={!!errors.especie}
            disabled={formDisabled}
          >
            <option value="">Seleccionar…</option>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="otro">Otro</option>
          </select>
          <FieldError message={errors.especie} />
        </div>

        <div>
          <label htmlFor="raza" className="text-sm font-medium text-gray-700">
            Raza *
          </label>
          <input
            id="raza"
            type="text"
            className={inputClass}
            value={form.raza}
            onChange={(e) => update('raza', e.target.value)}
            aria-invalid={!!errors.raza}
            maxLength={100}
            disabled={formDisabled}
          />
          <FieldError message={errors.raza} />
        </div>

        <div>
          <label htmlFor="edadAnios" className="text-sm font-medium text-gray-700">
            Edad (años) *
          </label>
          <input
            id="edadAnios"
            type="number"
            min={0}
            max={30}
            className={inputClass}
            value={form.edadAnios}
            onChange={(e) => update('edadAnios', e.target.value)}
            aria-invalid={!!errors.edad}
            disabled={formDisabled}
          />
        </div>

        <div>
          <label htmlFor="edadMeses" className="text-sm font-medium text-gray-700">
            Edad (meses) *
          </label>
          <input
            id="edadMeses"
            type="number"
            min={0}
            max={11}
            className={inputClass}
            value={form.edadMeses}
            onChange={(e) => update('edadMeses', e.target.value)}
            aria-invalid={!!errors.edad}
            disabled={formDisabled}
          />
          <FieldError message={errors.edad} />
        </div>

        <div>
          <label htmlFor="tamano" className="text-sm font-medium text-gray-700">
            Tamaño *
          </label>
          <select
            id="tamano"
            className={inputClass}
            value={form.tamano}
            onChange={(e) => update('tamano', e.target.value)}
            aria-invalid={!!errors.tamano}
            disabled={formDisabled}
          >
            <option value="">Seleccionar…</option>
            <option value="pequeno">Pequeño</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
          </select>
          <FieldError message={errors.tamano} />
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
              checked={form.compatibleNinos}
              onChange={(e) => update('compatibleNinos', e.target.checked)}
              disabled={formDisabled}
            />
            Compatible con niños
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
              checked={form.compatiblePerros}
              onChange={(e) => update('compatiblePerros', e.target.checked)}
              disabled={formDisabled}
            />
            Compatible con perros
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
              checked={form.compatibleGatos}
              onChange={(e) => update('compatibleGatos', e.target.checked)}
              disabled={formDisabled}
            />
            Compatible con gatos
          </label>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="temperamento" className="text-sm font-medium text-gray-700">
            Temperamento *
          </label>
          <textarea
            id="temperamento"
            rows={2}
            className={inputClass}
            value={form.temperamento}
            onChange={(e) => update('temperamento', e.target.value)}
            aria-invalid={!!errors.temperamento}
            maxLength={500}
            disabled={formDisabled}
          />
          <FieldError message={errors.temperamento} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
            Descripción *
          </label>
          <textarea
            id="descripcion"
            rows={4}
            className={inputClass}
            value={form.descripcion}
            onChange={(e) => update('descripcion', e.target.value)}
            aria-invalid={!!errors.descripcion}
            maxLength={2000}
            disabled={formDisabled}
            placeholder="Cuéntales a los adoptantes sobre la personalidad, cuidados y historia de la mascota…"
          />
          <FieldError message={errors.descripcion} />
        </div>

        <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-secondary" aria-hidden />
            <h3 className="font-heading text-lg text-gray-900">Información médica</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="vacunas" className="text-sm font-medium text-gray-700">
                Estado de vacunación *
              </label>
              <input
                id="vacunas"
                type="text"
                className={inputClass}
                value={form.vacunas}
                onChange={(e) => update('vacunas', e.target.value)}
                aria-invalid={!!errors.vacunas}
                disabled={formDisabled}
                placeholder="Ej. Al día, pendiente rabia…"
              />
              <FieldError message={errors.vacunas} />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-secondary focus:ring-secondary"
                  checked={form.esterilizado}
                  onChange={(e) => update('esterilizado', e.target.checked)}
                  disabled={formDisabled}
                />
                Esterilizado / castrado
              </label>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="condiciones_especiales" className="text-sm font-medium text-gray-700">
                Condiciones especiales
              </label>
              <textarea
                id="condiciones_especiales"
                rows={2}
                className={inputClass}
                value={form.condiciones_especiales}
                onChange={(e) => update('condiciones_especiales', e.target.value)}
                aria-invalid={!!errors.condiciones_especiales}
                maxLength={1500}
                disabled={formDisabled}
                placeholder="Diabetes, medicación, dieta especial…"
              />
              <FieldError message={errors.condiciones_especiales} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notas_medicas" className="text-sm font-medium text-gray-700">
                Notas médicas
              </label>
              <textarea
                id="notas_medicas"
                rows={2}
                className={inputClass}
                value={form.notas_medicas}
                onChange={(e) => update('notas_medicas', e.target.value)}
                aria-invalid={!!errors.notas_medicas}
                maxLength={3000}
                disabled={formDisabled}
                placeholder="Observaciones del veterinario o refugio…"
              />
              <FieldError message={errors.notas_medicas} />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-primary" aria-hidden />
            <h3 className="font-heading text-lg text-gray-900">Requisitos del hogar</h3>
          </div>
          <label htmlFor="requisitos_especiales" className="text-sm font-medium text-gray-700">
            Requisitos para el hogar adoptante
          </label>
          <textarea
            id="requisitos_especiales"
            rows={2}
            className={inputClass}
            value={form.requisitos_especiales}
            onChange={(e) => update('requisitos_especiales', e.target.value)}
            aria-invalid={!!errors.requisitos_especiales}
            maxLength={1500}
            disabled={formDisabled}
            placeholder="Patio cerrado, experiencia con perros reactivos…"
          />
          <FieldError message={errors.requisitos_especiales} />
        </div>
      </div>

      <PhotoUploader
        fotos={form.fotos}
        previews={previews}
        error={errors.fotos}
        disabled={formDisabled}
        isSubmitting={isSubmitting}
        onChange={handlePhotosChange}
      />

      <button
        type="submit"
        disabled={isSubmitting || formDisabled}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:opacity-90 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            Guardando…
          </>
        ) : (
          <>
            <Save className="w-5 h-5" aria-hidden />
            Publicar mascota
          </>
        )}
      </button>

      {isLoadingRefugio && (
        <p className="text-center text-sm text-gray-500">Cargando refugio…</p>
      )}
    </form>
  )
}
