import { Star } from 'lucide-react'

const FILLED_STAR = 'fill-primary text-primary'
const EMPTY_STAR = 'text-gray-300'

/**
 * @param {{
 *   rating: number,
 *   max?: number,
 *   size?: 'sm' | 'md' | 'lg',
 *   showValue?: boolean,
 *   interactive?: boolean,
 *   onChange?: (rating: number) => void,
 *   ariaLabel?: string,
 * }} props
 */
export default function StarRating({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
  ariaLabel = 'Valoración',
}) {
  const iconClass =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
  const rounded = Math.round(rating * 2) / 2

  return (
    <div
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`${ariaLabel}: ${rating} de ${max}`}
    >
      <div className="inline-flex items-center gap-0.5">
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1
          const filled = rounded >= starValue
          const half = !filled && rounded >= starValue - 0.5
          const active = filled || half

          if (interactive) {
            return (
              <button
                key={starValue}
                type="button"
                onClick={() => onChange?.(starValue)}
                className="p-0.5 rounded hover:scale-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`${starValue} estrella${starValue > 1 ? 's' : ''}`}
              >
                <Star
                  className={`${iconClass} ${active ? FILLED_STAR : EMPTY_STAR}`}
                  aria-hidden
                />
              </button>
            )
          }

          return (
            <Star
              key={starValue}
              className={`${iconClass} ${active ? FILLED_STAR : EMPTY_STAR}`}
              aria-hidden
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700 tabular-nums font-body">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
