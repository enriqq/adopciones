import { useCallback, useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { fetchApplicationMessages } from '../../services/refugeApplicationService.js'
import { validateMessageBody } from '../../lib/validators/refugeDecisionValidators.js'
import { mapSupabaseError } from '../../services/petService.js'

/**
 * @param {{
 *   applicationId: string | null,
 *   viewerRole: 'refugio' | 'applicant',
 *   onSend: (applicationId: string, body: string) => Promise<void>,
 *   isMutating?: boolean,
 * }} props
 */
export default function ApplicationMessageThread({
  applicationId,
  viewerRole,
  onSend,
  isMutating = false,
}) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const loadMessages = useCallback(async () => {
    if (!applicationId) {
      setMessages([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const rows = await fetchApplicationMessages(applicationId)
      setMessages(rows)
    } catch (err) {
      setMessages([])
      setError(mapSupabaseError(err))
    } finally {
      setIsLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!applicationId) {
        setMessages([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const rows = await fetchApplicationMessages(applicationId)
        if (cancelled) return
        setMessages(rows)
      } catch (err) {
        if (cancelled) return
        setMessages([])
        setError(mapSupabaseError(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [applicationId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!applicationId) return

    const validationError = validateMessageBody(draft)
    if (validationError) {
      setError(validationError)
      return
    }

    setSending(true)
    setError(null)

    try {
      await onSend(applicationId, draft)
      setDraft('')
      await loadMessages()
    } catch {
      /* feedback handled by parent */
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="font-heading text-sm font-semibold text-gray-800">Mensajes</h4>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Cargando mensajes…
        </div>
      )}

      {error && !isLoading && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
          {error}
        </p>
      )}

      {!isLoading && messages.length === 0 && (
        <p className="text-xs text-gray-500 py-2">Aún no hay mensajes en este hilo.</p>
      )}

      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {messages.map((msg) => {
          const isMine =
            (viewerRole === 'refugio' && msg.sender_role === 'refugio') ||
            (viewerRole === 'applicant' && msg.sender_role === 'applicant')

          return (
            <li
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  isMine
                    ? 'bg-secondary/15 text-gray-800 border border-secondary/20'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">
                  {msg.sender_role === 'refugio' ? 'Refugio' : 'Adoptante'}
                </p>
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(msg.created_at).toLocaleString('es-MX')}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje…"
          maxLength={2000}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
        <button
          type="submit"
          disabled={sending || isMutating || !draft.trim()}
          className="inline-flex items-center gap-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Send className="w-4 h-4" aria-hidden />
          )}
          Enviar
        </button>
      </form>
    </div>
  )
}
