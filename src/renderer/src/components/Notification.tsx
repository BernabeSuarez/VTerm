import { X } from 'lucide-react'

interface Notification {
  id: string
  type: 'error' | 'info'
  message: string
}

interface NotificationProps {
  notifications: Notification[]
  onClose: (id: string) => void
}

export function Notification({ notifications, onClose }: NotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`p-4 rounded-lg shadow-lg border flex justify-between items-start animate-in slide-in-from-right-4 fade-in duration-200 ${
            n.type === 'error'
              ? 'bg-red-900/90 border-red-700 text-red-100'
              : 'bg-ui-surface border-ui-border text-ui-text'
          }`}
        >
          <div className="text-sm font-medium pr-4">{n.message}</div>
          <button
            onClick={() => onClose(n.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
