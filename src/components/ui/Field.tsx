import type { ReactNode } from 'react'

/** A settings row: label + optional description on the left, control on the right. */
export function Field({
  label,
  description,
  children,
  stacked = false,
}: {
  label: string
  description?: string
  children: ReactNode
  stacked?: boolean
}) {
  if (stacked) {
    return (
      <div className="border-b border-line py-3">
        <p className="text-[13.5px] text-ink-soft">{label}</p>
        {description && <p className="mt-0.5 text-[12px] text-ink-mute">{description}</p>}
        <div className="mt-2">{children}</div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] text-ink-soft">{label}</p>
        {description && <p className="mt-0.5 text-[12px] leading-[1.45] text-ink-mute">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Section heading used inside Settings tabs. */
export function SettingsGroup({
  title,
  description,
  children,
  className = '',
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mb-8 ${className}`}>
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.09em] text-ink-mute">
        {title}
      </h3>
      {description && <p className="mt-1 text-[12.5px] text-ink-mute">{description}</p>}
      <div className="mt-2">{children}</div>
    </section>
  )
}

interface KbdProps {
  children?: ReactNode
  className?: string
  tone?: 'default' | 'on-accent'
}

/** Keyboard badge, e.g. shortcut hints. */
export function Kbd({ children, className = '', tone = 'default' }: KbdProps) {
  return (
    <kbd
      className={`inline-flex h-[21px] min-w-[22px] items-center justify-center rounded-[5px] px-1.5 text-[11px] font-medium ${
        tone === 'on-accent'
          ? 'bg-white/15 text-white'
          : 'border border-line bg-surface-3 text-ink-mute'
      } ${className}`}
    >
      {children}
    </kbd>
  )
}

/** Small explanatory note (hints, warnings). */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-[12px] leading-[1.5] text-ink-mute">
      {children}
    </p>
  )
}
