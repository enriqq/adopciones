import { useRef } from 'react'
import { AlertCircle, ImagePlus, X } from 'lucide-react'
import { mergePhotoFiles } from '../../lib/validators/petFormValidators.js'

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
 *   fotos: File[],
 *   previews: { url: string, name: string }[],
 *   error?: string,
 *   disabled?: boolean,
 *   isSubmitting?: boolean,
 *   onChange: (files: File[], previews: { url: string, name: string }[]) => void,
 * }} props
 */
export default function PhotoUploader({
  fotos,
  previews,
  error,
  disabled = false,
  isSubmitting = false,
  onChange,
}) {
  const fileInputRef = useRef(null)

  const revokeAll = (items) => {
    items.forEach((p) => URL.revokeObjectURL(p.url))
  }

  const handleFiles = (fileList) => {
    const merged = mergePhotoFiles(fotos, fileList)
    revokeAll(previews)
    const nextPreviews = merged.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
    }))
    onChange(merged, nextPreviews)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (index) => {
    const nextFiles = fotos.filter((_, i) => i !== index)
    const removed = previews[index]
    if (removed) URL.revokeObjectURL(removed.url)
    const nextPreviews = previews.filter((_, i) => i !== index)
    onChange(nextFiles, nextPreviews)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <label htmlFor="fotos" className="text-sm font-medium text-gray-700">
        Fotos * (1 a 5)
      </label>
      <div
        className="mt-2 border-2 border-dashed border-secondary/50 rounded-xl p-6 text-center hover:border-secondary transition cursor-pointer"
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !disabled) fileInputRef.current?.click()
        }}
        role="button"
        tabIndex={0}
        aria-invalid={!!error}
      >
        <ImagePlus className="w-10 h-10 mx-auto text-secondary mb-2" aria-hidden />
        <p className="text-sm text-gray-600">
          Haz clic para subir JPEG, PNG o WebP (máx. 5 MB c/u)
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {fotos.length}/5 seleccionadas
        </p>
        <input
          ref={fileInputRef}
          id="fotos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
      </div>
      <FieldError message={error} />

      {previews.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <li key={preview.url} className="relative group">
              <img
                src={preview.url}
                alt={`Vista previa ${index + 1}`}
                className="w-full h-28 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-gray-900/70 text-white hover:bg-gray-900"
                aria-label={`Quitar foto ${index + 1}`}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
