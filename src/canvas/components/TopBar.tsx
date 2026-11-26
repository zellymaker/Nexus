/**
 * Canvas top bar: canvas switcher (rename on double click, delete with
 * confirmation), autosave indicator, undo/redo, zoom controls and actions.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Download,
  Maximize,
  Plus,
  Redo2,
  RotateCcw,
  Search,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useT } from '../../lib/i18n'
import {
  selectCanRedo,
  selectCanUndo,
  useCanvasStore,
} from '../store'
import { useSaveStatus } from '../hooks/useSaveStatus'
import type { Viewport } from '../types'
import { chrome, iconButtonStyle } from '../theme'

interface TopBarProps {
  viewport: Viewport
  onCreateCanvas: () => void
  onRequestDeleteCanvas: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onResetZoom: () => void
  onSearch: () => void
  onExport: () => void
}

function BarButton({
  label,
  disabled = false,
  active = false,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...iconButtonStyle(active, disabled),
        background: active ? chrome.surface3 : hover && !disabled ? chrome.hover : 'transparent',
        color: disabled ? chrome.mute : active ? chrome.text : hover ? chrome.text : chrome.dim,
      }}
    >
      {children}
    </button>
  )
}

function SaveIndicator() {
  const t = useT()
  const state = useSaveStatus()
  const saved = state === 'saved'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11.5,
        color: chrome.mute,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      title={saved ? t('canvas.saved', 'Saved') : t('canvas.unsaved', 'Saving…')}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: saved ? chrome.success : chrome.warn,
          opacity: saved ? 0.9 : 0.7,
          transition: 'background-color 140ms ease',
        }}
      />
      {saved ? t('canvas.saved', 'Saved') : t('canvas.unsaved', 'Saving…')}
    </span>
  )
}

function CanvasTab({
  name,
  active,
  renaming,
  onSelect,
  onStartRename,
  onCommitRename,
}: {
  name: string
  active: boolean
  renaming: boolean
  onSelect: () => void
  onStartRename: () => void
  onCommitRename: (name: string) => void
}) {
  const [hover, setHover] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!renaming) return
    setValue(name)
    const timer = window.setTimeout(() => inputRef.current?.select(), 10)
    return () => window.clearTimeout(timer)
  }, [renaming, name])

  if (renaming) {
    return (
      <input
        ref={inputRef}
        value={value}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => onCommitRename(value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onCommitRename(value)
          } else if (event.key === 'Escape') {
            event.preventDefault()
            onCommitRename(name)
          }
          event.stopPropagation()
        }}
        style={{
          height: 26,
          width: Math.max(90, name.length * 8 + 28),
          borderRadius: 7,
          border: `1px solid ${chrome.borderStrong}`,
          background: chrome.input,
          color: chrome.text,
          fontSize: 12.5,
          font: 'inherit',
          padding: '0 8px',
          outline: 'none',
        }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onStartRename}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={name}
      style={{
        height: 26,
        maxWidth: 190,
        padding: '0 10px',
        borderRadius: 7,
        border: `1px solid ${active ? chrome.borderStrong : 'transparent'}`,
        background: active ? chrome.surface3 : hover ? chrome.hover : 'transparent',
        color: active ? chrome.text : chrome.soft,
        fontSize: 12.5,
        font: 'inherit',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
    >
      {name}
    </button>
  )
}

export function TopBar({
  viewport,
  onCreateCanvas,
  onRequestDeleteCanvas,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetZoom,
  onSearch,
  onExport,
}: TopBarProps) {
  const t = useT()
  const canvases = useCanvasStore((state) => state.canvases)
  const activeCanvasId = useCanvasStore((state) => state.activeCanvasId)
  const setActiveCanvas = useCanvasStore((state) => state.setActiveCanvas)
  const renameCanvas = useCanvasStore((state) => state.renameCanvas)
  const undo = useCanvasStore((state) => state.undo)
  const redo = useCanvasStore((state) => state.redo)
  const canUndo = useCanvasStore(selectCanUndo)
  const canRedo = useCanvasStore(selectCanRedo)
  const [renamingId, setRenamingId] = useState<string | null>(null)

  const zoomPercent = Math.round(viewport.scale * 100)
  const hasCanvas = Boolean(activeCanvasId)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 44,
        flexShrink: 0,
        padding: '0 12px',
        borderBottom: `1px solid ${chrome.border}`,
        background: chrome.toolbar,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          minWidth: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
        className="scroll-thin"
      >
        {canvases.map((canvas) => (
          <CanvasTab
            key={canvas.id}
            name={canvas.name}
            active={canvas.id === activeCanvasId}
            renaming={renamingId === canvas.id}
            onSelect={() => setActiveCanvas(canvas.id)}
            onStartRename={() => setRenamingId(canvas.id)}
            onCommitRename={(name) => {
              renameCanvas(canvas.id, name)
              setRenamingId(null)
            }}
          />
        ))}
        <BarButton label={t('canvas.new', 'New canvas')} onClick={onCreateCanvas}>
          <Plus size={15} strokeWidth={1.9} />
        </BarButton>
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      <SaveIndicator />

      <div style={{ width: 1, height: 18, background: chrome.border, margin: '0 2px' }} />

      <BarButton label={t('canvas.undo', 'Undo')} disabled={!canUndo} onClick={undo}>
        <Undo2 size={16} strokeWidth={1.8} />
      </BarButton>
      <BarButton label={t('canvas.redo', 'Redo')} disabled={!canRedo} onClick={redo}>
        <Redo2 size={16} strokeWidth={1.8} />
      </BarButton>

      <div style={{ width: 1, height: 18, background: chrome.border, margin: '0 2px' }} />

      <BarButton label={t('canvas.zoomOut', 'Zoom out')} onClick={onZoomOut}>
        <ZoomOut size={16} strokeWidth={1.8} />
      </BarButton>
      <button
        type="button"
        onClick={onResetZoom}
        title={t('canvas.resetZoom', 'Reset zoom')}
        style={{
          height: 24,
          minWidth: 44,
          padding: '0 6px',
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: chrome.soft,
          fontSize: 12,
          font: 'inherit',
          fontVariantNumeric: 'tabular-nums',
          cursor: 'pointer',
        }}
      >
        {zoomPercent}%
      </button>
      <BarButton label={t('canvas.zoomIn', 'Zoom in')} onClick={onZoomIn}>
        <ZoomIn size={16} strokeWidth={1.8} />
      </BarButton>
      <BarButton label={t('canvas.fit', 'Fit to content')} onClick={onFit}>
        <Maximize size={15} strokeWidth={1.8} />
      </BarButton>
      <BarButton label={t('canvas.resetZoom', 'Reset zoom')} onClick={onResetZoom}>
        <RotateCcw size={15} strokeWidth={1.8} />
      </BarButton>

      <div style={{ width: 1, height: 18, background: chrome.border, margin: '0 2px' }} />

      <BarButton label={t('canvas.search', 'Search objects')} onClick={onSearch}>
        <Search size={16} strokeWidth={1.8} />
      </BarButton>
      <BarButton label={t('canvas.exportPng', 'Export PNG')} onClick={onExport} disabled={!hasCanvas}>
        <Download size={16} strokeWidth={1.8} />
      </BarButton>
      <BarButton
        label={t('canvas.deleteCanvas', 'Delete canvas')}
        onClick={onRequestDeleteCanvas}
        disabled={!hasCanvas}
      >
        <Trash2 size={15} strokeWidth={1.8} />
      </BarButton>
    </div>
  )
}

