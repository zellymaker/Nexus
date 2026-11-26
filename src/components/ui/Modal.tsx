import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button, IconButton } from './Button'

type ModalSize = 'sm' | 'md' | 'lg'

const SIZES: Record<ModalSize, string> = {
  sm: 'w-[380px]',
  md: 'w-[480px]',
  lg: 'w-[720px] max-w-[92vw]',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: ModalSize
  children?: ReactNode
  footer?: ReactNode
  /** Dim/click on backdrop closes the modal. */
  closeOnBackdrop?: boolean
  ariaLabel?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
  ariaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const timer = window.setTimeout(() => {
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusables?.[0]?.focus()
    }, 20)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-6"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className={`anim-pop-in max-h-[86vh] overflow-y-auto rounded-xl border border-line bg-surface shadow-palette ${SIZES[size]}`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-3.5 pt-4">
            <div>
              {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
              {description && (
                <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-mute">{description}</p>
              )}
            </div>
            <IconButton label="Close" compact onClick={onClose}>
              <X size={15} strokeWidth={2} />
            </IconButton>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Extra content rendered above the actions (choices, checkboxes). */
  children?: ReactNode
  confirmDisabled?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
  children,
  confirmDisabled,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      ariaLabel={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
