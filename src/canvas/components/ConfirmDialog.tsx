/**
 * Small NEXUS-styled confirmation dialog (canvas deletion).
 */
import type { ReactNode } from 'react'
import { chrome, floatingPanelStyle } from '../theme'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(4, 5, 8, 0.5)',
      }}
      onMouseDown={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: 360,
          padding: 18,
          ...floatingPanelStyle,
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: chrome.text }}>
          {title}
        </p>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: chrome.dim,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <ActionButton onClick={onCancel}>{cancelLabel}</ActionButton>
          <ActionButton
            primary
            tone={tone}
            onClick={onConfirm}
          >
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  primary = false,
  tone = 'default',
  onClick,
  children,
}: {
  primary?: boolean
  tone?: 'danger' | 'default'
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 28,
        padding: '0 12px',
        borderRadius: 7,
        border: `1px solid ${primary && tone === 'danger' ? 'transparent' : chrome.border}`,
        background: primary
          ? tone === 'danger'
            ? chrome.danger
            : chrome.accent
          : 'transparent',
        color: primary ? '#ffffff' : chrome.soft,
        fontSize: 12.5,
        fontWeight: primary ? 600 : 500,
        font: 'inherit',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
