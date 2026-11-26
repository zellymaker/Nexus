/**
 * Empty states: no canvases at all, and an empty board with quick actions.
 */
import { FileText, LayoutGrid, StickyNote } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useT } from '../../lib/i18n'
import { chrome, floatingPanelStyle } from '../theme'

export function NoCanvases({ onCreate }: { onCreate: () => void }) {
  const t = useT()
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: chrome.main,
        zIndex: 5,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          maxWidth: 340,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 44,
            height: 44,
            borderRadius: 12,
            background: chrome.surface2,
            color: chrome.mute,
          }}
        >
          <LayoutGrid size={22} strokeWidth={1.6} />
        </span>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: chrome.text }}>
          {t('canvas.noCanvas', 'No canvases yet')}
        </p>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: chrome.mute }}>
          {t(
            'canvas.createHint',
            'Create a canvas to connect your notes and ideas visually',
          )}
        </p>
        <button
          type="button"
          onClick={onCreate}
          style={{
            marginTop: 4,
            height: 30,
            padding: '0 14px',
            borderRadius: 8,
            border: `1px solid ${chrome.borderStrong}`,
            background: chrome.accent,
            color: '#ffffff',
            fontSize: 12.5,
            fontWeight: 600,
            font: 'inherit',
            cursor: 'pointer',
          }}
        >
          {t('canvas.new', 'New canvas')}
        </button>
      </div>
    </div>
  )
}

export function EmptyCanvasHint({
  onAddSticky,
  onAddDocument,
}: {
  onAddSticky: () => void
  onAddDocument: () => void
}) {
  const t = useT()
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 18,
        transform: 'translateX(-50%)',
        zIndex: 15,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 8px 7px 14px',
          pointerEvents: 'auto',
          ...floatingPanelStyle,
        }}
      >
        <span style={{ fontSize: 12.5, color: chrome.mute, whiteSpace: 'nowrap' }}>
          {t(
            'canvas.emptyCanvas',
            'Empty canvas — pick a tool on the left, or start with',
          )}
        </span>
        <button type="button" onClick={onAddSticky} style={hintButtonStyle}>
          <StickyNote size={14} strokeWidth={1.8} />
          {t('canvas.tools.sticky', 'Sticky')}
        </button>
        <button type="button" onClick={onAddDocument} style={hintButtonStyle}>
          <FileText size={14} strokeWidth={1.8} />
          {t('canvas.addDocument', 'Add document')}
        </button>
      </div>
    </div>
  )
}

const hintButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  height: 26,
  padding: '0 9px',
  borderRadius: 7,
  border: `1px solid ${chrome.border}`,
  background: chrome.surface,
  color: chrome.soft,
  fontSize: 12,
  font: 'inherit',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
