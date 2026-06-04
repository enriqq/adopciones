import { useState } from 'react'
import { Columns3, LayoutList, Loader2 } from 'lucide-react'
import ApplicationDetailDrawer from './ApplicationDetailDrawer.jsx'
import ApplicationKanban from './ApplicationKanban.jsx'
import ApplicationTable from './ApplicationTable.jsx'

/**
 * @param {{
 *   applications: object[],
 *   isLoading: boolean,
 *   error: string | null,
 *   viewMode: 'table' | 'kanban',
 *   setViewMode: (mode: 'table' | 'kanban') => void,
 *   approve: (id: string) => Promise<void>,
 *   reject: (id: string) => Promise<void>,
 *   sendMessage: (applicationId: string, body: string) => Promise<void>,
 *   isMutating: boolean,
 * }} props
 */
export default function RefugeApplicationsDashboard({
  applications,
  isLoading,
  error,
  viewMode,
  setViewMode,
  approve,
  reject,
  sendMessage,
  isMutating,
}) {
  const [selected, setSelected] = useState(null)

  const handleApprove = async (id) => {
    await approve(id)
    setSelected(null)
  }

  const handleReject = async (id) => {
    await reject(id)
    setSelected(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {applications.length} solicitud{applications.length === 1 ? '' : 'es'} en total
        </p>
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'table'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-pressed={viewMode === 'table'}
          >
            <LayoutList className="w-4 h-4" aria-hidden />
            Tabla
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'kanban'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-pressed={viewMode === 'kanban'}
          >
            <Columns3 className="w-4 h-4" aria-hidden />
            Kanban
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          Cargando solicitudes…
        </div>
      )}

      {error && !isLoading && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
          {error}
        </p>
      )}

      {!isLoading && !error && viewMode === 'table' && (
        <ApplicationTable
          applications={applications}
          onSelect={setSelected}
          onApprove={handleApprove}
          onReject={handleReject}
          isMutating={isMutating}
        />
      )}

      {!isLoading && !error && viewMode === 'kanban' && (
        <ApplicationKanban
          applications={applications}
          onSelect={setSelected}
          onApprove={handleApprove}
          onReject={handleReject}
          isMutating={isMutating}
        />
      )}

      <ApplicationDetailDrawer
        application={selected}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onSendMessage={sendMessage}
        isMutating={isMutating}
      />
    </div>
  )
}
