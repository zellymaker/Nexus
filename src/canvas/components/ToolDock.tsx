/**
 * Floating vertical tool dock (left side of the board), styled like the rest
 * of the NEXUS chrome. Image / document entries are commands, not modes.
 */
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Circle,
  Eraser,
  FileText,
  Hand,
  Image,
  MousePointer2,
  Pencil,
  Spline,
  Square,
  StickyNote,
  Type,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '../../lib/i18n'
import { formatBinding, resolveBindings } from '../../lib/shortcuts'
import { useStore } from '../../lib/store'
import { useCanvasStore } from '../store'
import type { Tool } from '../types'
import { chrome, floatingPanelStyle } from '../theme'

interface ToolDockProps {
  onImage: () => void
  onDocument: () => void
}

interface DockEntry {
  tool?: Tool
  icon: LucideIcon
  labelKey: string
  fallback: string
  shortcutId: string
  command?: 'image' | 'document'
  dividerBefore?: boolean
}

const ENTRIES: DockEntry[] = [
  { tool: 'select', icon: MousePointer2, labelKey: 'canvas.tools.select', fallback: 'Select', shortcutId: 'canvas-select' },
  { tool: 'hand', icon: Hand, labelKey: 'canvas.tools.hand', fallback: 'Hand', shortcutId: 'canvas-hand' },
  { tool: 'sticky', icon: StickyNote, labelKey: 'canvas.tools.sticky', fallback: 'Sticky', shortcutId: 'canvas-sticky', dividerBefore: true },
  { tool: 'text', icon: Type, labelKey: 'canvas.tools.text', fallback: 'Text', shortcutId: 'canvas-text' },
  { tool: 'rect', icon: Square, labelKey: 'canvas.tools.shape', fallback: 'Shape', shortcutId: 'canvas-shape' },
  { tool: 'ellipse', icon: Circle, labelKey: 'canvas.tools.shape', fallback: 'Shape', shortcutId: 'canvas-shape' },
  { tool: 'connector', icon: Spline, labelKey: 'canvas.tools.connector', fallback: 'Connector', shortcutId: 'canvas-connector', dividerBefore: true },
  { tool: 'draw', icon: Pencil, labelKey: 'canvas.tools.draw', fallback: 'Draw', shortcutId: 'canvas-draw' },
  { command: 'image', icon: Image, labelKey: 'canvas.tools.image', fallback: 'Image', shortcutId: 'canvas-image', dividerBefore: true },
  { command: 'document', icon: FileText, labelKey: 'canvas.tools.document', fallback: 'Document', shortcutId: 'canvas-document' },
  { tool: 'eraser', icon: Eraser, labelKey: 'canvas.tools.eraser', fallback: 'Eraser', shortcutId: 'canvas-eraser', dividerBefore: true },
]

function DockButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 30,
        height: 30,
        borderRadius: 7,
        border: 'none',
        cursor: 'pointer',
        background: active ? chrome.accent : hover ? chrome.hover : 'transparent',
        color: active ? '#ffffff' : hover ? chrome.text : chrome.dim,
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
    >
      {children}
    </button>
  )
}

export function ToolDock({ onImage, onDocument }: ToolDockProps) {
  const t = useT()
  const tool = useCanvasStore((state) => state.tool)
  const setTool = useCanvasStore((state) => state.setTool)
  const overrides = useStore((state) => state.settings.shortcuts)
  const bindings = useMemo(() => resolveBindings(overrides), [overrides])

  return (
    <div
      role="toolbar"
      aria-label={t('canvas.tools.select', 'Tools')}
      style={{
        position: 'absolute',
        left: 12,
        top: 12,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 5,
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
        ...floatingPanelStyle,
      }}
      className="scroll-thin"
    >
      {ENTRIES.map((entry) => {
        const Icon = entry.icon
        const active = entry.tool ? tool === entry.tool : false
        const binding = entry.shortcutId ? formatBinding(bindings[entry.shortcutId]) : ''
        const title = `${t(entry.labelKey, entry.fallback)}${binding ? ` · ${binding}` : ''}`
        return (
          <div key={`${entry.labelKey}-${entry.tool ?? entry.command}-${entry.icon.displayName ?? ''}`} style={{ display: 'contents' }}>
            {entry.dividerBefore && (
              <div style={{ height: 1, margin: '3px 4px', background: chrome.border }} />
            )}
            <DockButton
              active={active}
              title={title}
              onClick={() => {
                if (entry.command === 'image') onImage()
                else if (entry.command === 'document') onDocument()
                else if (entry.tool) setTool(entry.tool)
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
            </DockButton>
          </div>
        )
      })}
    </div>
  )
}
