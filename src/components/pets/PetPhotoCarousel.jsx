import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * @param {{
 *   photos: string[],
 *   alt: string,
 * }} props
 */
export default function PetPhotoCarousel({ photos, alt }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safePhotos = photos?.length ? photos : []
  const hasMultiple = safePhotos.length > 1
  const current = safePhotos[activeIndex]

  const goTo = useCallback(
    (index) => {
      if (!safePhotos.length) return
      const next = ((index % safePhotos.length) + safePhotos.length) % safePhotos.length
      setActiveIndex(next)
    },
    [safePhotos.length],
  )

  const goPrev = () => goTo(activeIndex - 1)
  const goNext = () => goTo(activeIndex + 1)

  const handleKeyDown = (e) => {
    if (!hasMultiple) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goNext()
    }
  }

  if (!safePhotos.length) {
    return (
      <div className="aspect-[4/3] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        Sin fotos
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100"
        tabIndex={hasMultiple ? 0 : undefined}
        role={hasMultiple ? 'region' : undefined}
        aria-label={hasMultiple ? `Galería de fotos de ${alt}` : undefined}
        aria-roledescription={hasMultiple ? 'carrusel' : undefined}
        onKeyDown={handleKeyDown}
      >
        <img
          src={current}
          alt={`${alt} — foto ${activeIndex + 1} de ${safePhotos.length}`}
          className="aspect-[4/3] w-full object-cover"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow text-gray-800 hover:bg-white transition"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow text-gray-800 hover:bg-white transition"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex justify-center gap-2" role="tablist" aria-label="Indicadores de fotos">
          {safePhotos.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Ir a foto ${index + 1}`}
              onClick={() => goTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex
                  ? 'w-6 bg-primary'
                  : 'w-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
