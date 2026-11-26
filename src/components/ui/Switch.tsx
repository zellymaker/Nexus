interface SwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}

/** Animated on/off switch used across Settings. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-none disabled:opacity-40 ${
        checked ? 'bg-accent' : 'bg-surface-3 border border-line-strong'
      }`}
    >
      <span
        className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all duration-150 ${
          checked ? 'left-[18px]' : 'left-[2px]'
        }`}
      />
    </button>
  )
}
