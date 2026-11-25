import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import type { Command } from '../lib/data'

interface CommandPaletteProps {
  open: boolean
  query: string
  selectedIndex: number
  commands: Command[]
  onQueryChange: (q: string) => void
  onSelectedIndexChange: (i: number) => void
  onClose: () => void
  onExecute: (id: Command['id']) => void
}

export function CommandPalette({
  open,
  query,
  selectedIndex,
  commands,
  onQueryChange,
  onSelectedIndexChange,
  onClose,
  onExecute,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 10)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (commands.length > 0)
        onSelectedIndexChange((selectedIndex + 1) % commands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commands.length > 0)
        onSelectedIndexChange(
          (selectedIndex - 1 + commands.length) % commands.length,
        )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = commands[selectedIndex]
      if (cmd) onExecute(cmd.id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#05060a]/30 pt-[32.5vh]"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-[412px] rounded-[10px] bg-[#26262d] p-[8px] shadow-palette"
      >
        <div className="flex h-[36px] items-center gap-[10px] rounded-[9px] border border-[#565168] bg-[#31333b] px-[11px]">
          <Search size={16} strokeWidth={1.9} className="shrink-0 text-[#9a9aa4]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="/"
            aria-label="Search commands"
            className="min-w-0 flex-1 bg-transparent text-[14.5px] text-[#ececf1] outline-none placeholder:text-[#8f8f9a]"
          />
        </div>

        <div className="mt-[8px] flex flex-col gap-[1px]">
          {commands.length === 0 && (
            <p className="px-[11px] py-[9px] text-[13.5px] text-[#8b8b95]">
              No matching commands
            </p>
          )}
          {commands.map((cmd, i) => {
            const selected = i === selectedIndex
            return (
              <button
                key={cmd.id}
                type="button"
                onMouseEnter={() => onSelectedIndexChange(i)}
                onClick={() => onExecute(cmd.id)}
                className={`flex h-[30px] w-full items-center justify-between rounded-[7px] px-[11px] text-left transition-colors ${
                  selected
                    ? 'bg-[#877ffe] text-white'
                    : 'text-[#d6d6dd] hover:bg-white/[0.05]'
                }`}
              >
                <span className="truncate text-[14px]">{cmd.label}</span>
                <kbd
                  className={`ml-4 flex h-[22px] min-w-[26px] shrink-0 items-center justify-center rounded-[5px] px-[6px] text-[11px] font-medium ${
                    selected
                      ? 'bg-[#43425c] text-[#ececf1]'
                      : 'bg-[#303139] text-[#9b9ba6]'
                  }`}
                >
                  {cmd.shortcut}
                </kbd>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
