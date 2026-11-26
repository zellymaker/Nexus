/**
 * Right-click context menu for objects, connections and the empty canvas.
 * Groups are built by the workspace; this component only renders and clamps
 * itself into the window.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { chrome, menuDividerStyle, menuItemStyle, menuStyle } from '../theme'

export interface MenuItemDef {
  label: string
  icon?: LucideIcon
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  onSelect: () => void
}

export interface MenuGroupDef {
  label?: string
  items: MenuItemDef[]
  /** Render as a compact horizontal icon row (alignment). */
  inline?: boolean
}

export interface ContextMenuProps {
  x: number
  y: number
  groups: MenuGroupDef[]
  onClose: () => void
}

function MenuRow({ item, onClose }: { item: MenuItemDef; onClose: () => void }) {
  const [hover, setHover] = useState(false)
  const Icon = item.icon
  return (
    <button
      type="button"
      disabled={item.disabled}
      onClick={() => {
        if (item.disabled) return
        item.onSelect()
        onClose()
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...menuItemStyle(item.danger, item.disabled),
        background: hover && !item.disabled ? chrome.hover : 'transparent',
      }}
    >
      {Icon && (
        <span style={{ display: 'flex', flexShrink: 0, opacity: 0.85 }}>
          <Icon size={14} strokeWidth={1.8} />
        </span>
      )}
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.shortcut && (
        <span style={{ fontSize: 10.5, color: chrome.mute, marginLeft: 14 }}>{item.shortcut}</span>
      )}
    </button>
  )
}

function InlineGroup({ group, onClose }: { group: MenuGroupDef; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '1px 4px' }}>
      {group.items.map((item) => {
        const Icon = item.icon
        return (
          <InlineButton
            key={item.label}
            label={item.label}
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return
              item.onSelect()
              onClose()
            }}
          >
            {Icon ? <Icon size={14} strokeWidth={1.8} /> : item.label}
          </InlineButton>
        )
      })}
    </div>
  )
}

function InlineButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
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
        display: 'grid',
        placeItems: 'center',
        width: 26,
        height: 26,
        borderRadius: 6,
        border: 'none',
        background: hover && !disabled ? chrome.hover : 'transparent',
        color: disabled ? chrome.mute : chrome.dim,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

export function ContextMenu({ x, y, groups, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const element = menuRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8))
    const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))
    setPosition((previous) =>
      previous.left === left && previous.top === top ? previous : { left, top },
    )
  }, [x, y])

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 59 }}
        onMouseDown={onClose}
        onContextMenu={(event) => {
          event.preventDefault()
          onClose()
        }}
        role="presentation"
      />
      <div
        ref={menuRef}
        role="menu"
        style={{ ...menuStyle, left: position.left, top: position.top }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {groups.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`}>
            {groupIndex > 0 && <div style={menuDividerStyle} />}
            {group.label && (
              <div
                style={{
                  padding: '4px 8px 2px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: chrome.mute,
                }}
              >
                {group.label}
              </div>
            )}
            {group.inline ? (
              <InlineGroup group={group} onClose={onClose} />
            ) : (
              group.items.map((item) => (
                <MenuRow key={item.label} item={item} onClose={onClose} />
              ))
            )}
          </div>
        ))}
      </div>
    </>
  )
}
