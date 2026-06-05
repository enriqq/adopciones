import { useState } from 'react'
import { LogIn, MessageSquareQuote, Star } from 'lucide-react'
import { useShelterReviews } from '../../hooks/useShelterReviews.js'
import StarRating from './StarRating.jsx'

function formatReviewDate(isoDate) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(isoDate))
  } catch {
    return isoDate
  }
}

/**
 * @param {{
 *   shelterId: string,
 *   shelterNombre: string,
 *   session?: object | null,
 *   onLoginPrompt?: () => void,
 * }} props
 */
export default function ReviewSection({
  shelterId,
  shelterNombre,
  session = null,
  onLoginPrompt,
}) {
  const userId = session?.user?.id ?? null
  const {
    reviews,
    summary,
    canShowForm,
    isLoading,
    isSubmitting,
    error,
    submitReview,
  } = useShelterReviews(shelterId, userId)

  const [draftRating, setDraftRating] = useState(0)
  const [draftComment, setDraftComment] = useState('')
  const [formError, setFormError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)

    if (draftRating < 1) {
      setFormError('Selecciona una valoración de 1 a 5 estrellas.')
      return
    }

    const trimmed = draftComment.trim()
    if (trimmed.length < 10) {
      setFormError('El comentario debe tener al menos 10 caracteres.')
      return
    }

    try {
      await submitReview({ rating_1_to_5: draftRating, comment: trimmed })
      setDraftRating(0)
      setDraftComment('')
    } catch (err) {
      setFormError(err?.message ?? 'No se pudo enviar la valoración.')
    }
  }

  return (
    <section
      className="space-y-4 border border-gray-200 rounded-2xl p-6 bg-white/80"
      aria-labelledby="review-section-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-primary shrink-0" aria-hidden />
            <h2 id="review-section-heading" className="font-heading text-xl text-gray-900">
              Valoraciones del refugio
            </h2>
          </div>
          <p className="text-sm text-gray-600 font-body">
            Opiniones de otros adoptantes sobre{' '}
            <span className="font-medium text-gray-800">{shelterNombre}</span>
          </p>
        </div>

        {!isLoading && summary.review_count > 0 && summary.avg_rating != null && (
          <div className="flex flex-col items-end gap-1">
            <StarRating rating={summary.avg_rating} size="lg" showValue />
            <p className="text-xs text-gray-500 font-body">
              {summary.review_count}{' '}
              {summary.review_count === 1 ? 'valoración' : 'valoraciones'}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-body">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-body">
          Aún no hay valoraciones para este refugio. Las opiniones de adoptantes ayudan a generar
          confianza en el proceso.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 font-body">
                    {review.reviewer_display_name}
                  </span>
                  <StarRating
                    rating={review.rating_1_to_5}
                    size="sm"
                    ariaLabel="Valoración del adoptante"
                  />
                </div>
                <time className="text-xs text-gray-400 font-body" dateTime={review.created_at}>
                  {formatReviewDate(review.created_at)}
                </time>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-body">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canShowForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-heading font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary fill-primary" aria-hidden />
            Comparte tu experiencia
          </h3>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 font-body">Tu valoración</p>
            <StarRating
              rating={draftRating || 0}
              interactive
              onChange={setDraftRating}
              ariaLabel="Selecciona tu valoración"
            />
          </div>

          <div>
            <label htmlFor={`review-comment-${shelterId}`} className="text-xs font-medium text-gray-600 font-body">
              Comentario
            </label>
            <textarea
              id={`review-comment-${shelterId}`}
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Cuéntanos cómo fue tu experiencia con este refugio..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {formError && <p className="text-xs text-red-700 font-body">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium font-body hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando…' : 'Publicar valoración'}
          </button>
        </form>
      )}

      {!userId && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-body">
          <LogIn className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <span>Inicia sesión para dejar tu valoración.</span>
          {onLoginPrompt && (
            <button
              type="button"
              onClick={onLoginPrompt}
              className="text-primary font-medium hover:underline"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      )}
    </section>
  )
}
