/**
 * Picker for placing a workspace note as a document card on the canvas.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import type { WsNode } from '../../lib/store'
import { chrome, floatingPanelStyle, inputStyle } from '../theme'
import type { TFunction } from '../../lib/messages'

export interface DocumentPickerProps {
  open: boolean
  notes: WsNode[]
  onClose: () => void
  onPick: (nodeId: string) => void
  t: TFunction
}

export function DocumentPicker({ open, notes, onClose, onPick, t }: DocumentPickerProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const timer = window.setTimeout(() => inputRef.current?.focus(), 10)
    return () => window.clearTimeout(timer)
  }, [open])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle
      ? notes.filter((note) => note.name.toLowerCase().includes(needle))
      : notes
    return list.slice(0, 40)
  }, [notes, query])

  if (!open) return null

  const pickFirst = () => {
    const first = filtered[0]
    if (!first) return
    onPick(first.id)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 45,
        display: 'flex',
        justifyContent: 'center',
      }}
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('canvas.addDocument', 'Add document')}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          marginTop: 14,
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          ...floatingPanelStyle,
          padding: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 34,
            padding: '0 10px',
            borderRadius: 8,
            border: `1px solid ${chrome.border}`,
            background: chrome.input,
          }}
        >
          <Search size={15} strokeWidth={1.9} style={{ color: chrome.mute, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                pickFirst()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
              }
              event.stopPropagation()
            }}
            placeholder={t('canvas.addDocument', 'Choose a document…')}
            aria-label={t('canvas.addDocument', 'Add document')}
            style={{ ...inputStyle, height: 28, border: 'none', background: 'transparent', padding: 0 }}
          />
        </div>

        <p
          style={{
            margin: '8px 0 4px',
            padding: '0 10px',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: chrome.mute,
          }}
        >
          {t('canvas.objects', 'Notes')}
        </p>

        <div style={{ maxHeight: 320, overflowY: 'auto' }} className="scroll-thin">
          {filtered.length === 0 && (
            <p style={{ margin: 0, padding: '9px 10px', fontSize: 12.5, color: chrome.mute }}>
              {t('search.noResults', 'Nothing found')}
            </p>
          )}
          {filtered.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => {
                onPick(note.id)
                onClose()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                width: '100%',
                minHeight: 30,
                padding: '5px 10px',
                borderRadius: 7,
                border: 'none',
                background: 'transparent',
                color: chrome.soft,
                fontSize: 12.5,
                font: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = chrome.hover
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent'
              }}
            >
              <FileText size={14} strokeWidth={1.8} style={{ color: chrome.mute, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {note.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
