/**
 * Matcher for shortcut bindings.
 *
 * `lib/shortcuts.ts` matches on `KeyboardEvent.key`, which breaks for
 * non-Latin keyboard layouts (RU) and for shifted digits (`Shift+1` arrives as
 * `!`). The canvas resolves its shortcuts through this tolerant matcher.
 */
import { normalizeBinding } from '../../lib/shortcuts'

const isLetter = (key: string) => key.length === 1 && /[A-Z]/.test(key)
const isDigit = (key: string) => key.length === 1 && /[0-9]/.test(key)

export function bindingMatches(binding: string | undefined, event: KeyboardEvent): boolean {
  if (!binding) return false
  const normalized = normalizeBinding(binding)
  if (!normalized) return false
  const parts = normalized.split('+')
  const key = parts.pop() ?? ''
  const needCtrl = parts.includes('Ctrl')
  const needAlt = parts.includes('Alt')
  const needShift = parts.includes('Shift')
  const needMeta = parts.includes('Meta')

  if (event.ctrlKey !== needCtrl) return false
  if (event.altKey !== needAlt) return false
  if (event.shiftKey !== needShift) return false
  if (event.metaKey !== needMeta) return false

  if (isLetter(key)) {
    // Layout-independent tool keys (V/H/S/T/R/C/D/E/…) and Ctrl+Z on RU layout.
    return event.code === `Key${key}` || event.key.toUpperCase() === key
  }
  if (isDigit(key)) {
    return (
      event.code === `Digit${key}` ||
      event.code === `Numpad${key}` ||
      event.key === key
    )
  }
  if (key === 'Space') return event.code === 'Space' || event.key === ' '
  if (key === ',') return event.code === 'Comma' || event.key === ','
  if (key === '.') return event.code === 'Period' || event.key === '.'
  return event.key === key
}
