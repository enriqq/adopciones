import PetProfileForm from '../components/pets/PetProfileForm.jsx'

/**
 * Vista de registro de mascota (FEAT-001 §5.3).
 * @param {{ onSuccess?: (pet: object) => void }} props
 */
export default function CreatePetPage({ onSuccess }) {
  return (
    <section aria-labelledby="registrar-mascota">
      <h2 id="registrar-mascota" className="sr-only">
        Registrar mascota
      </h2>
      <PetProfileForm onSuccess={onSuccess} />
    </section>
  )
}
