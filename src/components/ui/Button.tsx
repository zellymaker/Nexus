import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium select-none ' +
  'disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-bright active:scale-[0.985] shadow-sm',
  secondary:
    'bg-surface-2 text-ink-soft border border-line hover:bg-surface-3 hover:text-ink active:scale-[0.985]',
  ghost:
    'text-ink-dim hover:bg-hover hover:text-ink active:scale-[0.985]',
  danger:
    'bg-danger/15 text-danger border border-danger/25 hover:bg-danger/25 active:scale-[0.985]',
}

const sizes: Record<Size, string> = {
  sm: 'h-[26px] px-2 text-[12.5px]',
  md: 'h-[32px] px-3.5 text-[13.5px]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  danger?: boolean
  compact?: boolean
  children: ReactNode
}

export function IconButton({
  label,
  active = false,
  danger = false,
  compact = false,
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`grid place-items-center rounded-md transition-colors ${
        compact ? 'h-[24px] w-[24px]' : 'h-[28px] w-[28px]'
      } ${
        active
          ? 'bg-accent/15 text-accent-bright'
          : danger
            ? 'text-ink-dim hover:bg-danger/15 hover:text-danger'
            : 'text-ink-dim hover:bg-hover hover:text-ink'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
