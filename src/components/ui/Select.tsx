import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption<T extends string | number> {
  value: T
  label: string
  description?: string
}

interface SelectProps<T extends string | number> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
  disabled?: boolean
}

/** Custom dropdown (native select can't match the NEXUS theme). */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  className = '',
  disabled,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value)),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const commit = (option: SelectOption<T>) => {
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v)
          setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)))
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className="flex h-[30px] w-full min-w-[150px] items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-2.5 text-[13px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
      >
        <span className="truncate">{current?.label ?? '—'}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.9}
          className={`shrink-0 text-ink-mute transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="anim-menu-in absolute right-0 top-[34px] z-40 max-h-[280px] min-w-full overflow-y-auto rounded-lg border border-line bg-surface-2 p-1 shadow-menu"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => Math.min(options.length - 1, i + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => Math.max(0, i - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              const option = options[activeIndex]
              if (option) commit(option)
            }
          }}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const selected = option.value === value
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option)}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${
                  index === activeIndex ? 'bg-hover' : ''
                }`}
              >
                <span className="min-w-0">
                  <span className={`block truncate text-[13px] ${selected ? 'text-ink' : 'text-ink-soft'}`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="mt-0.5 block truncate text-[11.5px] text-ink-mute">
                      {option.description}
                    </span>
                  )}
                </span>
                {selected && <Check size={14} className="shrink-0 text-accent" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
