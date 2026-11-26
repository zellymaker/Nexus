/**
 * Applies the user's settings to the DOM (CSS custom properties + data
 * attributes). Themes themselves live in `src/index.css` as
 * `[data-theme='…']` blocks of CSS variables, so adding a theme is a CSS-only
 * change; this module only chooses and applies it.
 */
import type { Settings, ThemeId } from './settings'
import { isThemeId } from './settings'

const DARK_MEDIA = '(prefers-color-scheme: dark)'
const REDUCED_MOTION_MEDIA = '(prefers-reduced-motion: reduce)'

export function systemTheme(): ThemeId {
  if (typeof window === 'undefined' || !window.matchMedia) return 'nexus-dark'
  return window.matchMedia(DARK_MEDIA).matches ? 'nexus-dark' : 'nexus-light'
}

export function resolveTheme(choice: Settings['theme']): ThemeId {
  return choice === 'system' ? systemTheme() : isThemeId(choice) ? choice : 'nexus-dark'
}

export function systemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(REDUCED_MOTION_MEDIA).matches
}

export function effectiveReducedMotion(settings: Settings): boolean {
  if (!settings.animations) return true
  if (settings.motion === 'reduced') return true
  if (settings.motion === 'full') return false
  return systemPrefersReducedMotion()
}

const fontStack = (family: string) => {
  const fallback =
    family.includes('Mono') || family === 'monospace'
      ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
      : "'Inter Variable', Inter, system-ui, sans-serif"
  if (family === 'system-ui') return fallback
  return `'${family}', ${fallback}`
}

export function applySettings(settings: Settings) {
  const root = document.documentElement
  const theme = resolveTheme(settings.theme)

  root.dataset.theme = theme
  root.dataset.density = settings.density
  root.dataset.motion = effectiveReducedMotion(settings) ? 'reduced' : 'full'
  root.style.colorScheme = theme === 'nexus-light' ? 'light' : 'dark'

  const style = root.style
  style.setProperty('--ui-scale', String(settings.uiScale))
  style.setProperty('--font-ui', fontStack(settings.typography.uiFont))
  style.setProperty('--font-editor', fontStack(settings.typography.editorFont))
  style.setProperty('--font-mono', fontStack(settings.typography.monoFont))
  style.setProperty('--text-base', `${settings.typography.baseSize}px`)
  style.setProperty('--text-leading', String(settings.typography.lineHeight))
  style.setProperty('--text-weight', String(settings.typography.fontWeight))
  style.setProperty('--editor-size', `${settings.editor.fontSize}px`)
  style.setProperty('--editor-leading', String(settings.editor.lineHeight))
  style.setProperty('--editor-cursor', settings.editor.cursorStyle)
  style.setProperty('--editor-tab-size', String(settings.editor.tabSize))
  style.setProperty('--editor-wrap', settings.editor.wrap ? 'pre-wrap' : 'pre')
}

/**
 * Subscribe to OS-level theme/motion changes so `system` preferences stay
 * live. Returns an unsubscribe function.
 */
export function watchSystemPreferences(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const dark = window.matchMedia(DARK_MEDIA)
  const motion = window.matchMedia(REDUCED_MOTION_MEDIA)
  dark.addEventListener('change', onChange)
  motion.addEventListener('change', onChange)
  return () => {
    dark.removeEventListener('change', onChange)
    motion.removeEventListener('change', onChange)
  }
}
