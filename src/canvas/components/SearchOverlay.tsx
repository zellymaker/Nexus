/**
 * In-canvas object search (Ctrl+F): finds text objects, stickies and document
 * cards, then centres the viewport on the chosen object.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Search, StickyNote, Type } from 'lucide-react'
import type { CanvasObject } from '../types'
import { chrome, floatingPanelStyle, inputStyle } from '../theme'
import type { TFunction } from '../../lib/messages'

export interface SearchOverlayProps {
  open: boolean
  objects: CanvasObject[]
  documentTitle: (nodeId: string) => string | null
  onClose: () => void
  onPick: (objectId: string) => void
  t: TFunction
}

interface SearchResult {
  id: string
  label: string
  detail: string
  icon: 'sticky' | 'text' | 'document'
}

function iconFor(kind: SearchResult['icon']) {
  if (kind === 'sticky') return <StickyNote size={14} strokeWidth={1.8} />
  if (kind === 'text') return <Type size={14} strokeWidth={1.8} />
  return <FileText size={14} strokeWidth={1.8} />
}

export function SearchOverlay({
  open,
  objects,
  documentTitle,
  onClose,
  onPick,
  t,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setIndex(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 10)
    return () => window.clearTimeout(timer)
  }, [open])

  const results = useMemo<SearchResult[]>(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    const found: SearchResult[] = []
    for (const object of objects) {
      if (object.kind === 'sticky' || object.kind === 'text') {
        const text = object.text.trim()
        if (!text) continue
        if (!text.toLowerCase().includes(needle)) continue
        found.push({
          id: object.id,
          label: text.split('\n')[0].slice(0, 90),
          detail: object.kind === 'sticky' ? t('canvas.tools.sticky', 'Sticky') : t('canvas.tools.text', 'Text'),
          icon: object.kind,
        })
      } else if (object.kind === 'document') {
        const title = documentTitle(object.nodeId)
        const label = title ?? t('canvas.missingDocument', 'Document deleted')
        if (!label.toLowerCase().includes(needle)) continue
        found.push({
          id: object.id,
          label,
          detail: t('canvas.tools.document', 'Document'),
          icon: 'document',
        })
      }
    }
    return found.slice(0, 12)
  }, [objects, documentTitle, query, t])

  useEffect(() => {
    if (index >= results.length) setIndex(0)
  }, [results.length, index])

  if (!open) return null

  const pick = (result: SearchResult | undefined) => {
    if (!result) return
    onPick(result.id)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
      }}
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('canvas.search', 'Search objects')}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          marginTop: 14,
          width: 420,
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
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setIndex((previous) => (results.length ? (previous + 1) % results.length : 0))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setIndex((previous) =>
                  results.length ? (previous - 1 + results.length) % results.length : 0,
                )
              } else if (event.key === 'Enter') {
                event.preventDefault()
                pick(results[index])
              } else if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
              }
              event.stopPropagation()
            }}
            placeholder={t('canvas.search', 'Search objects…')}
            aria-label={t('canvas.search', 'Search objects')}
            style={{ ...inputStyle, height: 28, border: 'none', background: 'transparent', padding: 0 }}
          />
        </div>

        {query.trim().length > 0 && (
          <div style={{ marginTop: 6, maxHeight: 260, overflowY: 'auto' }} className="scroll-thin">
            {results.length === 0 && (
              <p style={{ margin: 0, padding: '9px 10px', fontSize: 12.5, color: chrome.mute }}>
                {t('search.noResults', 'Nothing found')}
              </p>
            )}
            {results.map((result, resultIndex) => (
              <button
                key={result.id}
                type="button"
                onMouseMove={() => setIndex(resultIndex)}
                onClick={() => pick(result)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  height: 30,
                  padding: '0 9px',
                  borderRadius: 7,
                  border: 'none',
                  background: resultIndex === index ? chrome.accent : 'transparent',
                  color: resultIndex === index ? '#ffffff' : chrome.soft,
                  fontSize: 12.5,
                  font: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', opacity: 0.85, flexShrink: 0 }}>
                  {iconFor(result.icon)}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.label}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10.5,
                    color: resultIndex === index ? 'rgba(255,255,255,0.7)' : chrome.mute,
                  }}
                >
                  {result.detail}
                </span>
              </button>
            ))}
          </div>
        )}
        {query.trim().length === 0 && (
          <p style={{ margin: 0, padding: '9px 10px 7px', fontSize: 12, color: chrome.mute }}>
            {t('canvas.search', 'Search text, stickies and documents in this canvas')}
          </p>
        )}
      </div>
    </div>
  )
}
