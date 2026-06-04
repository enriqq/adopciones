import { Stethoscope } from 'lucide-react'

/**
 * @param {{
 *   record: {
 *     vacunas?: string,
 *     esterilizado?: boolean,
 *     condiciones_especiales?: string,
 *     notas_medicas?: string,
 *   } | null,
 * }} props
 */
export default function PetMedicalCard({ record }) {
  return (
    <section
      className="bg-secondary/10 border-2 border-secondary rounded-2xl p-6 text-gray-800 space-y-4"
      aria-labelledby="medical-info-heading"
    >
      <div className="flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-secondary shrink-0" aria-hidden />
        <h2 id="medical-info-heading" className="font-heading text-xl text-gray-900">
          Información médica
        </h2>
      </div>

      {!record ? (
        <p className="text-sm text-gray-600 leading-relaxed">
          Sin registro médico disponible.
        </p>
      ) : (
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-secondary">Vacunas</dt>
            <dd className="mt-0.5 leading-relaxed">{record.vacunas || '—'}</dd>
          </div>

          <div>
            <dt className="font-medium text-secondary">Esterilizado</dt>
            <dd className="mt-0.5">{record.esterilizado ? 'Sí' : 'No'}</dd>
          </div>

          <div>
            <dt className="font-medium text-secondary">Condiciones especiales</dt>
            <dd className="mt-0.5 leading-relaxed">
              {record.condiciones_especiales?.trim()
                ? record.condiciones_especiales
                : 'Sin condiciones especiales registradas.'}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-secondary">Notas médicas</dt>
            <dd className="mt-0.5 leading-relaxed">
              {record.notas_medicas?.trim() ? record.notas_medicas : '—'}
            </dd>
          </div>
        </dl>
      )}
    </section>
  )
}
