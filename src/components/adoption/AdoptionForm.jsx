import Swal from 'sweetalert2'
import { AlertCircle, ClipboardCheck, Home, Loader2, PawPrint } from 'lucide-react'
import { useAdoptionFormState } from '../../hooks/useAdoptionFormState.js'
import { useSubmitAdoptionApplication } from '../../hooks/useSubmitAdoptionApplication.js'
import {
  errorsToSwalHtml,
  TIPO_VIVIENDA_LABELS,
} from '../../lib/validators/adoptionFormValidators.js'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition'

const STEPS = [
  { num: 1, label: 'Tu hogar', icon: Home },
  { num: 2, label: 'Experiencia', icon: PawPrint },
  { num: 3, label: 'Revisión y envío', icon: ClipboardCheck },
]

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
 *   petId: string,
 *   petSummary: { nombre: string, foto?: string | null, refugio_nombre: string },
 *   applicantId: string,
 *   onSuccess: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function AdoptionForm({ petId, petSummary, applicantId, onSuccess, onCancel }) {
  const {
    state,
    setField,
    goNext,
    goPrev,
    validateAll,
    startSubmit,
    endSubmit,
  } = useAdoptionFormState()
  const { submit, isSubmitting } = useSubmitAdoptionApplication(applicantId)

  const handleNext = () => {
    goNext()
  }

  const handleSubmit = async () => {
    const result = validateAll()
    if (!result.valid) {
      await Swal.fire({
        icon: 'error',
        title: 'Revisa el formulario',
        html: errorsToSwalHtml(result.messages),
        confirmButtonColor: '#E07A5F',
      })
      return
    }

    startSubmit()
    try {
      await submit({
        petId,
        tipo_vivienda: state.tipo_vivienda,
        tiene_patio: state.tiene_patio,
        horas_solo: Number.parseInt(String(state.horas_solo), 10),
        experiencia_previa: state.experiencia_previa,
        otras_mascotas: state.otras_mascotas,
      })

      await Swal.fire({
        icon: 'success',
        title: '¡Solicitud enviada!',
        text: 'Puedes seguir el estado en Mis Solicitudes.',
        confirmButtonText: 'Ver mis solicitudes',
        confirmButtonColor: '#81B29A',
      })
      onSuccess()
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar',
        text: err.message ?? 'Intenta de nuevo más tarde.',
        confirmButtonColor: '#E07A5F',
      })
    } finally {
      endSubmit()
    }
  }

  const busy = isSubmitting || state.isSubmitting

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 md:p-8 space-y-6">
      <nav aria-label="Pasos del formulario" className="flex items-center justify-between gap-2">
        {STEPS.map(({ num, label, icon: Icon }) => (
          <div key={num} className="flex flex-1 flex-col items-center gap-1 min-w-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition ${
                state.step === num
                  ? 'bg-primary text-white'
                  : state.step > num
                    ? 'bg-secondary/20 text-secondary'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden />
            </div>
            <span className="text-xs text-gray-600 truncate w-full text-center">{label}</span>
          </div>
        ))}
      </nav>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4 items-center">
        {petSummary.foto ? (
          <img
            src={petSummary.foto}
            alt=""
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0" />
        )}
        <div>
          <p className="font-heading text-lg text-gray-900">{petSummary.nombre}</p>
          <p className="text-sm text-gray-600">{petSummary.refugio_nombre}</p>
        </div>
      </div>

      {state.step === 1 && (
        <section className="space-y-4" aria-labelledby="step-hogar">
          <h3 id="step-hogar" className="font-heading text-lg text-gray-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" aria-hidden />
            Tu hogar
          </h3>
          <div>
            <label htmlFor="tipo_vivienda" className="text-sm font-medium text-gray-700">
              Tipo de vivienda *
            </label>
            <select
              id="tipo_vivienda"
              className={inputClass}
              value={state.tipo_vivienda}
              onChange={(e) => setField('tipo_vivienda', e.target.value)}
              aria-invalid={!!state.errors.tipo_vivienda}
            >
              <option value="">Seleccionar…</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="otro">Otro</option>
            </select>
            <FieldError message={state.errors.tipo_vivienda} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-secondary focus:ring-secondary"
              checked={state.tiene_patio}
              onChange={(e) => setField('tiene_patio', e.target.checked)}
            />
            Tengo patio o espacio exterior
          </label>
          <div>
            <label htmlFor="horas_solo" className="text-sm font-medium text-gray-700">
              Horas al día que la mascota estaría sola *
            </label>
            <input
              id="horas_solo"
              type="number"
              min={0}
              max={24}
              className={inputClass}
              value={state.horas_solo}
              onChange={(e) => setField('horas_solo', e.target.value)}
              aria-invalid={!!state.errors.horas_solo}
            />
            <FieldError message={state.errors.horas_solo} />
          </div>
        </section>
      )}

      {state.step === 2 && (
        <section className="space-y-4" aria-labelledby="step-experiencia">
          <h3
            id="step-experiencia"
            className="font-heading text-lg text-gray-900 flex items-center gap-2"
          >
            <PawPrint className="w-5 h-5 text-secondary" aria-hidden />
            Experiencia con mascotas
          </h3>
          <div>
            <label htmlFor="experiencia_previa" className="text-sm font-medium text-gray-700">
              Experiencia previa *
            </label>
            <textarea
              id="experiencia_previa"
              rows={4}
              className={inputClass}
              value={state.experiencia_previa}
              onChange={(e) => setField('experiencia_previa', e.target.value)}
              aria-invalid={!!state.errors.experiencia_previa}
              placeholder="Mascotas que has tenido, cuidados, paseos, visitas al veterinario…"
            />
            <FieldError message={state.errors.experiencia_previa} />
          </div>
          <div>
            <label htmlFor="otras_mascotas" className="text-sm font-medium text-gray-700">
              Otras mascotas en el hogar
            </label>
            <textarea
              id="otras_mascotas"
              rows={2}
              className={inputClass}
              value={state.otras_mascotas}
              onChange={(e) => setField('otras_mascotas', e.target.value)}
              aria-invalid={!!state.errors.otras_mascotas}
              maxLength={500}
              placeholder="Opcional: perros, gatos u otros animales actuales"
            />
            <FieldError message={state.errors.otras_mascotas} />
          </div>
        </section>
      )}

      {state.step === 3 && (
        <section className="space-y-4" aria-labelledby="step-revision">
          <h3
            id="step-revision"
            className="font-heading text-lg text-gray-900 flex items-center gap-2"
          >
            <ClipboardCheck className="w-5 h-5 text-primary" aria-hidden />
            Revisión y envío
          </h3>
          <dl className="text-sm space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div>
              <dt className="font-medium text-gray-700">Vivienda</dt>
              <dd className="text-gray-600 capitalize">
                {TIPO_VIVIENDA_LABELS[state.tipo_vivienda] ?? state.tipo_vivienda} · Patio:{' '}
                {state.tiene_patio ? 'Sí' : 'No'} · Horas sola: {state.horas_solo}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Experiencia</dt>
              <dd className="text-gray-600 whitespace-pre-line">{state.experiencia_previa}</dd>
            </div>
            {state.otras_mascotas?.trim() && (
              <div>
                <dt className="font-medium text-gray-700">Otras mascotas</dt>
                <dd className="text-gray-600 whitespace-pre-line">{state.otras_mascotas}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        {state.step > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            disabled={busy}
            className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Anterior
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
        )}

        <div className="flex-1" />

        {state.step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={busy}
            className="bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Enviando…
              </>
            ) : (
              'Enviar solicitud'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
