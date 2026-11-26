import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { Toast } from '../../lib/store'

interface RenderedToast extends Toast {
  leaving: boolean
}

const ICONS = {
  default: Info,
  success: CheckCircle2,
  danger: AlertTriangle,
}

/** Bottom-right notification stack with enter/leave animations. */
export function ToastHost() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  const [rendered, setRendered] = useState<RenderedToast[]>([])
  const timers = useRef(new Map<string, number>())

  useEffect(() => {
    setRendered((current) => {
      const byId = new Map(current.map((t) => [t.id, t]))
      const next: RenderedToast[] = []
      // keep order: existing first, new appended
      for (const toast of current) {
        const live = toasts.find((t) => t.id === toast.id)
        if (live) next.push({ ...live, leaving: false })
        else if (!toast.leaving) {
          next.push({ ...toast, leaving: true })
          const timer = window.setTimeout(() => {
            setRendered((items) => items.filter((t) => t.id !== toast.id))
          }, 160)
          timers.current.set(toast.id, timer)
        } else next.push(toast)
      }
      for (const toast of toasts) {
        if (!byId.has(toast.id)) next.push({ ...toast, leaving: false })
      }
      return next
    })
  }, [toasts])

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) window.clearTimeout(timer)
    },
    [],
  )

  if (!rendered.length) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[130] flex w-[320px] flex-col gap-2">
      {rendered.map((toast) => {
        const Icon = ICONS[toast.tone]
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line bg-surface-2/95 px-3 py-2.5 shadow-menu backdrop-blur-sm ${
              toast.leaving ? 'toast-leave' : 'anim-slide-up'
            }`}
          >
            <Icon
              size={16}
              strokeWidth={1.9}
              className={`mt-0.5 shrink-0 ${
                toast.tone === 'danger'
                  ? 'text-danger'
                  : toast.tone === 'success'
                    ? 'text-success'
                    : 'text-accent'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] leading-[1.4] text-ink">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-[11.5px] leading-[1.45] text-ink-mute">{toast.message}</p>
              )}
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.()
                    dismiss(toast.id)
                  }}
                  className="mt-1.5 rounded-md border border-line px-2 py-0.5 text-[11.5px] text-accent-bright transition-colors hover:bg-hover"
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="grid h-[20px] w-[20px] shrink-0 place-items-center rounded text-ink-mute transition-colors hover:bg-hover hover:text-ink"
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
