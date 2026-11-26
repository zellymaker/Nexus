import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useCommands } from '../lib/commands'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { createPortal } from 'react-dom'

/** Floating command palette (Ctrl+P / Ctrl+Shift+P). */
export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen)
  const query = useStore((s) => s.paletteQuery)
  const setQuery = useStore((s) => s.setPaletteQuery)
  const setOpen = useStore((s) => s.setPaletteOpen)
  const commands = useCommands()
  const t = useT()
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((command) => {
      const haystack = `${command.label} ${command.keywords ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [commands, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    setSelected((index) => Math.min(index, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  if (!open) return null

  const execute = (index: number) => {
    const command = filtered[index]
    if (!command) return
    command.run()
    setOpen(false)
  }

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-[90] flex items-start justify-center bg-black/30 pt-[32.5vh]"
      onMouseDown={() => setOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('titlebar.palette', 'Command palette')}
        onMouseDown={(event) => event.stopPropagation()}
        className="anim-pop-in w-[412px] rounded-[10px] bg-surface-2 p-[8px] shadow-palette"
      >
        <div className="flex h-[36px] items-center gap-[10px] rounded-[9px] border border-accent-soft/60 bg-input px-[11px]">
          <Search size={16} strokeWidth={1.9} className="shrink-0 text-ink-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setSelected((index) => (index + 1) % Math.max(1, filtered.length))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setSelected(
                  (index) => (index - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length),
                )
              } else if (event.key === 'Enter') {
                event.preventDefault()
                execute(selected)
              } else if (event.key === 'Escape') {
                event.preventDefault()
                setOpen(false)
              }
            }}
            placeholder="/"
            aria-label={t('palette.placeholder', 'Search commands…')}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-mute"
          />
        </div>

        <div className="mt-[8px] flex flex-col gap-[1px]">
          {filtered.length === 0 && (
            <p className="px-[11px] py-[9px] text-[13px] text-ink-mute">
              {t('palette.empty', 'No matching commands')}
            </p>
          )}
          {filtered.map((command, index) => {
            const active = index === selected
            return (
              <button
                key={command.id}
                type="button"
                onMouseEnter={() => setSelected(index)}
                onClick={() => execute(index)}
                className={`flex h-[30px] w-full items-center justify-between rounded-[7px] px-[11px] text-left transition-colors ${
                  active ? 'bg-accent text-white' : 'text-ink-soft hover:bg-hover'
                }`}
              >
                <span className="truncate text-[14px]">{command.label}</span>
                {command.shortcut && (
                  <kbd
                    className={`ml-4 flex h-[22px] min-w-[26px] shrink-0 items-center justify-center rounded-[5px] px-[6px] text-[11px] font-medium ${
                      active ? 'bg-[#43425c] text-ink' : 'bg-surface-3 text-ink-mute'
                    }`}
                  >
                    {command.shortcut}
                  </kbd>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
