/**
 * Shared building blocks for the Settings sections.
 *
 * Everything here is styled with the NEXUS design tokens (`surface`, `line`,
 * `ink-*`, `accent`) so the settings view matches the rest of the app and
 * follows the selected theme automatically.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Monitor } from 'lucide-react'
import { THEMES } from '../lib/settings'
import type { ThemeChoice, ThemeId } from '../lib/settings'
import { resolveTheme, watchSystemPreferences } from '../lib/theme'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description?: string
}) {
  return (
    <header className="mb-6 flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-accent-bright">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-[12.5px] leading-[1.5] text-ink-mute">{description}</p>
        )}
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/*  Segmented control                                                  */
/* ------------------------------------------------------------------ */

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  disabled = false,
}: {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5 ${
        disabled ? 'pointer-events-none opacity-40' : ''
      }`}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`h-[26px] rounded-[6px] px-2.5 text-[12.5px] font-medium transition-colors ${
              active
                ? 'bg-surface-3 text-accent-bright'
                : 'text-ink-dim hover:bg-hover hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Slider row                                                         */
/* ------------------------------------------------------------------ */

export function SliderField({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
  disabled = false,
}: {
  label: string
  description?: string
  value: number
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-line py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] text-ink-soft">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12px] leading-[1.45] text-ink-mute">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <input
          type="range"
          className="nexus-range w-[150px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="tabular min-w-[54px] rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-center text-[12px] text-ink-soft">
          {format ? format(value) : String(value)}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Colour scheme picker                                               */
/* ------------------------------------------------------------------ */

/** Renders a theme preview with the real CSS token variables of that theme. */
function ThemePreview({ themeId, system = false }: { themeId: ThemeId; system?: boolean }) {
  return (
    <div
      data-theme={themeId}
      className="relative h-[52px] w-full overflow-hidden rounded-lg border border-line bg-app"
    >
      <span className="absolute inset-x-1.5 top-1.5 h-[7px] rounded-full bg-surface" />
      <span className="absolute bottom-1.5 left-1.5 h-[13px] w-[42%] rounded-[4px] bg-surface" />
      <span className="absolute bottom-1.5 left-[50%] h-[13px] w-[16%] rounded-[4px] bg-accent" />
      <span className="absolute bottom-1.5 right-1.5 h-[13px] w-[26%] rounded-[4px] bg-surface-2" />
      {system && (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-surface-3 text-ink shadow-sm">
            <Monitor size={12} strokeWidth={2} />
          </span>
        </span>
      )}
    </div>
  )
}

function ThemeCard({
  label,
  themeId,
  selected,
  onClick,
  hint,
  system = false,
}: {
  label: string
  themeId: ThemeId
  selected: boolean
  onClick: () => void
  hint?: string
  system?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`group rounded-xl border p-1.5 text-left transition-colors ${
        selected
          ? 'border-accent bg-surface-3'
          : 'border-line bg-surface-2 hover:border-line-strong hover:bg-surface-3'
      }`}
    >
      <div className="relative">
        <ThemePreview themeId={themeId} system={system} />
        {selected && (
          <span className="absolute right-1.5 top-1.5 grid h-[16px] w-[16px] place-items-center rounded-full bg-accent text-white shadow-sm">
            <Check size={10} strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="truncate text-[12.5px] font-medium text-ink-soft group-hover:text-ink">
          {label}
        </p>
        {hint && <p className="truncate text-[11px] text-ink-mute">{hint}</p>}
      </div>
    </button>
  )
}

/** All six real themes plus the "follow system" option. */
export function ThemeGrid({
  value,
  onChange,
}: {
  value: ThemeChoice
  onChange: (value: ThemeChoice) => void
}) {
  const t = useT()
  const language = useStore((s) => s.settings.language)
  const [systemTheme, setSystemTheme] = useState<ThemeId>(() => resolveTheme('system'))

  useEffect(() => {
    const update = () => setSystemTheme(resolveTheme('system'))
    update()
    return watchSystemPreferences(update)
  }, [])

  const systemMeta = THEMES.find((theme) => theme.id === systemTheme)
  const systemHint = t('settings.themeNow', 'Now: {name}').replace(
    '{name}',
    systemMeta?.label[language] ?? systemTheme,
  )

  return (
    <div
      role="radiogroup"
      aria-label={t('settings.theme', 'Theme')}
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
    >
      {THEMES.map((theme) => (
        <ThemeCard
          key={theme.id}
          label={theme.label[language]}
          themeId={theme.id}
          selected={value === theme.id}
          onClick={() => onChange(theme.id)}
        />
      ))}
      <ThemeCard
        label={t('settings.themeSystem', 'Follow system')}
        themeId={systemTheme}
        selected={value === 'system'}
        onClick={() => onChange('system')}
        hint={systemHint}
        system
      />
    </div>
  )
}
