import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon?: LucideIcon
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  checked?: boolean
  separatorBefore?: boolean
}

interface ContextMenuProps {
  open: boolean
  x: number
  y: number
  items: MenuItem[]
  onSelect: (id: string) => void
  onClose: () => void
}

/**
 * Floating context / dropdown menu. Positioned at the cursor, clamped to the
 * viewport, keyboard navigable, closes on outside click / Escape / scroll.
 */
export function ContextMenu({ open, x, y, items, onSelect, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })
  const [activeIndex, setActiveIndex] = useState(-1)

  useLayoutEffect(() => {
    if (!open) return
    const el = ref.current
    const pad = 8
    const width = el?.offsetWidth ?? 220
    const height = el?.offsetHeight ?? 200
    setPos({
      x: Math.min(x, window.innerWidth - width - pad),
      y: Math.min(y, window.innerHeight - height - pad),
    })
  }, [open, x, y])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(items.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        const item = items[activeIndex]
        if (item && !item.disabled) onSelect(item.id)
      }
    }
    const onScroll = () => onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', onScroll)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [open, items, activeIndex, onClose])

  useEffect(() => {
    if (!open) setActiveIndex(-1)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Context menu"
      style={{ left: pos.x, top: pos.y }}
      className="anim-menu-in fixed z-[120] min-w-[210px] rounded-lg border border-line bg-surface-2 py-1 shadow-menu"
    >
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={item.id}>
            {item.separatorBefore && <div className="my-1 h-px bg-line" />}
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect(item.id)}
              className={`flex h-[30px] w-full items-center gap-2.5 px-3 text-left text-[13px] transition-colors disabled:opacity-35 ${
                index === activeIndex ? 'bg-hover' : ''
              } ${item.danger ? 'text-danger' : 'text-ink-soft'}`}
            >
              {Icon ? (
                <Icon size={15} strokeWidth={1.8} className="shrink-0 opacity-80" />
              ) : (
                <span className="w-[15px] shrink-0" />
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {item.checked && <span className="text-[11px] text-accent">✓</span>}
              {item.shortcut && (
                <span className="ml-2 shrink-0 text-[11px] text-ink-mute">{item.shortcut}</span>
              )}
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
