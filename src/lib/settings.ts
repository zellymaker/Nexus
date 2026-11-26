/**
 * User-facing settings model for NEXUS.
 *
 * Everything here is persisted in the workspace store (`nexus:store:v1`)
 * and applied to the DOM by `lib/theme.ts`. Adding a new option means:
 *   1. add the field + default below;
 *   2. read it where it matters (theme.ts for CSS, components for behaviour);
 *   3. add UI in `src/settings/`.
 */

export type Language = 'ru' | 'en'

export type ThemeId =
  | 'nexus-dark'
  | 'midnight'
  | 'graphite'
  | 'nord'
  | 'dracula'
  | 'nexus-light'

export type ThemeChoice = ThemeId | 'system'
export type Density = 'comfortable' | 'compact'
export type MotionPreference = 'system' | 'full' | 'reduced'
export type SortMode = 'manual' | 'name' | 'modified' | 'created'
export type CursorStyle = 'bar' | 'underline' | 'block'

export interface Settings {
  language: Language
  /** Theme id or `system` to follow the OS colour scheme. */
  theme: ThemeChoice
  /** Interface scale: 0.9 = compact, 1 = default, 1.1 = large. */
  uiScale: number
  density: Density
  /** `system` honours `prefers-reduced-motion`. */
  motion: MotionPreference
  /** Master switch: when off, all transitions/animations are disabled. */
  animations: boolean

  typography: {
    uiFont: string
    editorFont: string
    monoFont: string
    baseSize: number
    lineHeight: number
    fontWeight: number
  }

  editor: {
    fontSize: number
    lineHeight: number
    wrap: boolean
    lineNumbers: boolean
    syntaxHighlight: boolean
    cursorStyle: CursorStyle
    tabSize: number
  }

  workspace: {
    confirmDelete: boolean
    /** Behaviour on cold start: restore the previous session or open Home. */
    startup: 'restore' | 'home'
    autosave: boolean
    /** Debounce for autosave, ms. */
    autosaveDelay: number
    sortFiles: SortMode
    sortFolders: SortMode
    showHidden: boolean
    /** Expand/collapse folder with a single click on the label. */
    expandOnClick: boolean
    revealActive: boolean
  }

  notifications: {
    toasts: boolean
    /** How long a toast stays on screen, ms. */
    duration: number
  }

  /**
   * Privacy switches. NEXUS ships with no telemetry, no analytics and no
   * network calls for user content — these exist to make that state explicit
   * and to control *local* diagnostics only.
   */
  privacy: {
    /** Keep local diagnostics (errors) in memory for the current session. */
    diagnostics: boolean
    /** Include file paths in diagnostics. Off by default. */
    diagnosticsPaths: boolean
    /** Clear diagnostics gathered so far. */
    clearDiagnostics: boolean
  }

  /** Keyboard bindings, keyed by shortcut id (see `lib/shortcuts.ts`). */
  shortcuts: Record<string, string>
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  theme: 'nexus-dark',
  uiScale: 1,
  density: 'comfortable',
  motion: 'system',
  animations: true,
  typography: {
    uiFont: 'Inter Variable',
    editorFont: 'Inter Variable',
    monoFont: 'JetBrains Mono',
    baseSize: 15,
    lineHeight: 1.5,
    fontWeight: 400,
  },
  editor: {
    fontSize: 15.5,
    lineHeight: 1.48,
    wrap: true,
    lineNumbers: false,
    syntaxHighlight: true,
    cursorStyle: 'bar',
    tabSize: 2,
  },
  workspace: {
    confirmDelete: true,
    startup: 'restore',
    autosave: true,
    autosaveDelay: 500,
    sortFiles: 'manual',
    sortFolders: 'manual',
    showHidden: false,
    expandOnClick: false,
    revealActive: true,
  },
  notifications: {
    toasts: true,
    duration: 4200,
  },
  privacy: {
    diagnostics: false,
    diagnosticsPaths: false,
    clearDiagnostics: false,
  },
  shortcuts: {},
}

export interface ThemeMeta {
  id: ThemeId
  label: Record<Language, string>
  dark: boolean
  /** [background, surface, accent] used for the theme swatch. */
  swatch: [string, string, string]
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'nexus-dark',
    label: { en: 'Nexus Dark', ru: 'Nexus Dark' },
    dark: true,
    swatch: ['#121217', '#232329', '#877ffe'],
  },
  {
    id: 'midnight',
    label: { en: 'Midnight', ru: 'Midnight' },
    dark: true,
    swatch: ['#0b1020', '#141b2d', '#6f8dff'],
  },
  {
    id: 'graphite',
    label: { en: 'Graphite', ru: 'Graphite' },
    dark: true,
    swatch: ['#17181a', '#232529', '#9aa4b2'],
  },
  {
    id: 'nord',
    label: { en: 'Nord', ru: 'Nord' },
    dark: true,
    swatch: ['#1e2229', '#2a303b', '#88c0d0'],
  },
  {
    id: 'dracula',
    label: { en: 'Dracula', ru: 'Dracula' },
    dark: true,
    swatch: ['#191a24', '#242636', '#bd93f9'],
  },
  {
    id: 'nexus-light',
    label: { en: 'Nexus Light', ru: 'Nexus Light' },
    dark: false,
    swatch: ['#f3f3f6', '#ffffff', '#6a5ae0'],
  },
]

/** Font families we offer in settings; all fall back gracefully if absent. */
export const UI_FONT_OPTIONS = [
  { value: 'Inter Variable', label: 'Inter (bundled)' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'Adwaita Sans', label: 'Adwaita Sans' },
  { value: 'Cantarell', label: 'Cantarell' },
  { value: 'Noto Sans', label: 'Noto Sans' },
  { value: 'DejaVu Sans', label: 'DejaVu Sans' },
  { value: 'Liberation Sans', label: 'Liberation Sans' },
]

export const MONO_FONT_OPTIONS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'monospace', label: 'System Mono' },
  { value: 'DejaVu Sans Mono', label: 'DejaVu Sans Mono' },
  { value: 'Liberation Mono', label: 'Liberation Mono' },
  { value: 'Noto Sans Mono', label: 'Noto Sans Mono' },
]

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
]

export const isThemeId = (v: unknown): v is ThemeId =>
  typeof v === 'string' && THEMES.some((t) => t.id === v)

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))
