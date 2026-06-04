import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { validateMessageContent } from '../lib/validators/messageValidators.js'
import {
  fetchMessages,
  mapSupabaseError,
  sendMessage as sendMessageApi,
} from '../services/messageService.js'

/**
 * @param {object} row
 */
function normalizeMessageRow(row) {
  return {
    id: row.id,
    application_id: row.application_id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    content: row.content,
    created_at: row.created_at,
  }
}

/**
 * @param {string | null} applicationId
 * @param {string | null} currentUserId
 */
export function useChat(applicationId, currentUserId) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(applicationId && currentUserId))
  const [error, setError] = useState(null)
  const [isSending, setIsSending] = useState(false)

  const appendMessage = useCallback((row) => {
    const normalized = normalizeMessageRow(row)
    setMessages((prev) => {
      if (prev.some((m) => m.id === normalized.id)) return prev
      return [...prev, normalized]
    })
  }, [])

  const load = useCallback(async () => {
    if (!applicationId || !currentUserId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const rows = await fetchMessages(applicationId)
      setMessages(rows.map(normalizeMessageRow))
    } catch (err) {
      setMessages([])
      setError(mapSupabaseError(err))
    } finally {
      setIsLoading(false)
    }
  }, [applicationId, currentUserId])

  useEffect(() => {
    if (!applicationId || !currentUserId || !supabase) {
      setMessages([])
      setIsLoading(false)
      return undefined
    }

    void load()

    const channel = supabase
      .channel(`messages:${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          if (payload.new) {
            appendMessage(payload.new)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [applicationId, currentUserId, load, appendMessage])

  const sendMessage = useCallback(
    async (content) => {
      if (!applicationId || !currentUserId) return

      const validationError = validateMessageContent(content)
      if (validationError) {
        setError(validationError)
        return
      }

      setIsSending(true)
      setError(null)

      try {
        const row = await sendMessageApi({ applicationId, content })
        appendMessage(row)
      } catch (err) {
        setError(mapSupabaseError(err))
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [applicationId, currentUserId, appendMessage],
  )

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending,
    refetch: load,
  }
}
