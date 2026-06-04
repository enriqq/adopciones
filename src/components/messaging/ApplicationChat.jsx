import { useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useChat } from '../../hooks/useChat.js'

/**
 * @param {string} iso
 */
function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

/**
 * @param {{
 *   applicationId: string | null,
 *   currentUserId: string | null,
 *   disabled?: boolean,
 * }} props
 */
export default function ApplicationChat({
  applicationId,
  currentUserId,
  disabled = false,
}) {
  const listRef = useRef(null)
  const [draft, setDraft] = useState('')
  const { messages, isLoading, error, sendMessage, isSending } = useChat(
    applicationId,
    currentUserId,
  )

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!draft.trim() || isSending || disabled) return

    try {
      await sendMessage(draft)
      setDraft('')
    } catch {
      /* error surfaced in hook */
    }
  }

  if (!applicationId || !currentUserId) {
    return (
      <p className="text-sm text-gray-500">
        Inicia sesión para usar el chat de esta solicitud.
      </p>
    )
  }

  return (
    <section
      className="flex flex-col min-h-[280px] max-h-[50vh] md:max-h-[420px] border border-gray-100 rounded-xl overflow-hidden bg-white"
      aria-label="Mensajes de la solicitud"
    >
      <header className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 shrink-0">
        <h4 className="font-heading text-sm font-semibold text-gray-900">Mensajes</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Coordina con el refugio o el adoptante en tiempo real
        </p>
      </header>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3 min-h-[160px]"
      >
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Cargando mensajes…
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6 px-2">
            Aún no hay mensajes. Escribe para coordinar con el refugio o el adoptante.
          </p>
        )}

        {!isLoading &&
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={
                    isOwn
                      ? 'max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 text-sm bg-secondary text-white shadow-sm'
                      : 'max-w-[85%] rounded-2xl rounded-bl-md px-3 py-2 text-sm bg-gray-100 text-gray-800'
                  }
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                  {formatRelativeTime(msg.created_at)}
                </span>
              </div>
            )
          })}
      </div>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 px-3 py-2 border-t border-red-100">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex gap-2 p-3 border-t border-gray-100 shrink-0 bg-white"
      >
        <label htmlFor={`chat-input-${applicationId}`} className="sr-only">
          Escribe un mensaje
        </label>
        <input
          id={`chat-input-${applicationId}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje…"
          disabled={disabled || isSending}
          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:opacity-60"
          maxLength={2000}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={disabled || isSending || draft.trim().length < 2}
          className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition"
          aria-label="Enviar mensaje"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Send className="w-4 h-4" aria-hidden />
          )}
        </button>
      </form>
    </section>
  )
}
