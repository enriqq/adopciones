import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'

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
 *   notifications: { id: string, message: string, is_read: boolean, created_at: string }[],
 *   unreadCount: number,
 *   isLoading: boolean,
 *   markAsRead: (id: string) => Promise<void>,
 *   markAllAsRead: () => Promise<void>,
 * }} props
 */
export default function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  markAsRead,
  markAllAsRead,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const handleToggle = () => setOpen((prev) => !prev)

  const handleItemClick = async (id, isRead) => {
    if (!isRead) {
      await markAsRead(id)
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Notificaciones"
        aria-expanded={open}
        className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        onClick={handleToggle}
      >
        <Bell className="w-5 h-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg z-30">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-semibold text-gray-900">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-secondary font-medium hover:underline"
                onClick={() => void markAllAsRead()}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {isLoading && (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">Cargando…</p>
          )}

          {!isLoading && notifications.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">
              No tienes notificaciones.
            </p>
          )}

          {!isLoading && notifications.length > 0 && (
            <ul className="divide-y divide-gray-50">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                      item.is_read ? 'opacity-75' : 'bg-orange-50/40'
                    }`}
                    onClick={() => void handleItemClick(item.id, item.is_read)}
                  >
                    <p className="text-sm text-gray-800 leading-snug">{item.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(item.created_at)}
                      {!item.is_read && (
                        <span className="ml-2 text-primary font-medium">Nueva</span>
                      )}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
