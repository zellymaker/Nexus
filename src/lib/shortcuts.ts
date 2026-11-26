/**
 * Shortcut registry + keyboard matching.
 *
 * Bindings are stored as normalised strings: `"Ctrl+Shift+N"`, `"Delete"`,
 * `"F2"`, `"Ctrl+,"`, `"Ctrl+Tab"`. `settings.shortcuts` stores user
 * overrides by shortcut id; anything absent uses `defaultBinding` below.
 *
 * The actual event listener lives in `lib/shortcutsRuntime.ts` so this module
 * stays pure/testable.
 */

export type ShortcutGroup = 'workspace' | 'navigation' | 'editor' | 'canvas' | 'app'

export interface ShortcutDef {
  id: string
  label: string
  group: ShortcutGroup
  defaultBinding: string
  /** Allow the shortcut to fire while a text field / contentEditable has focus. */
  allowInInput?: boolean
}

export const SHORTCUT_DEFS: ShortcutDef[] = [
  // workspace
  { id: 'create-note', label: 'Create note', group: 'workspace', defaultBinding: 'Ctrl+N', allowInInput: true },
  { id: 'create-folder', label: 'Create folder', group: 'workspace', defaultBinding: 'Ctrl+Shift+N', allowInInput: true },
  { id: 'create-canvas', label: 'Create canvas', group: 'workspace', defaultBinding: 'Ctrl+Alt+N', allowInInput: true },
  { id: 'delete-selection', label: 'Delete selected item', group: 'workspace', defaultBinding: 'Delete' },
  { id: 'rename-selection', label: 'Rename selected item', group: 'workspace', defaultBinding: 'F2' },
  { id: 'duplicate-selection', label: 'Duplicate selected item', group: 'workspace', defaultBinding: 'Ctrl+D', allowInInput: true },
  { id: 'save-document', label: 'Save document', group: 'workspace', defaultBinding: 'Ctrl+S', allowInInput: true },
  { id: 'undo', label: 'Undo', group: 'workspace', defaultBinding: 'Ctrl+Z', allowInInput: true },
  { id: 'redo', label: 'Redo', group: 'workspace', defaultBinding: 'Ctrl+Shift+Z', allowInInput: true },
  { id: 'toggle-sidebar', label: 'Toggle left sidebar', group: 'workspace', defaultBinding: 'Ctrl+B', allowInInput: true },

  // navigation
  { id: 'palette', label: 'Command palette', group: 'navigation', defaultBinding: 'Ctrl+P', allowInInput: true },
  { id: 'quick-search', label: 'Quick search', group: 'navigation', defaultBinding: 'Ctrl+Shift+P', allowInInput: true },
  { id: 'close-tab', label: 'Close tab', group: 'navigation', defaultBinding: 'Ctrl+W', allowInInput: true },
  { id: 'next-tab', label: 'Next tab', group: 'navigation', defaultBinding: 'Ctrl+Tab', allowInInput: true },
  { id: 'prev-tab', label: 'Previous tab', group: 'navigation', defaultBinding: 'Ctrl+Shift+Tab', allowInInput: true },
  { id: 'open-settings', label: 'Open settings', group: 'navigation', defaultBinding: 'Ctrl+,', allowInInput: true },
  { id: 'close-modal', label: 'Close modal / palette', group: 'navigation', defaultBinding: 'Escape', allowInInput: true },

  // canvas
  { id: 'canvas-select', label: 'Canvas: select tool', group: 'canvas', defaultBinding: 'V' },
  { id: 'canvas-hand', label: 'Canvas: hand tool', group: 'canvas', defaultBinding: 'H' },
  { id: 'canvas-sticky', label: 'Canvas: sticky note', group: 'canvas', defaultBinding: 'S' },
  { id: 'canvas-text', label: 'Canvas: text', group: 'canvas', defaultBinding: 'T' },
  { id: 'canvas-shape', label: 'Canvas: shape', group: 'canvas', defaultBinding: 'R' },
  { id: 'canvas-connector', label: 'Canvas: connector', group: 'canvas', defaultBinding: 'C' },
  { id: 'canvas-draw', label: 'Canvas: free draw', group: 'canvas', defaultBinding: 'D' },
  { id: 'canvas-image', label: 'Canvas: image', group: 'canvas', defaultBinding: 'I' },
  { id: 'canvas-document', label: 'Canvas: document card', group: 'canvas', defaultBinding: 'O' },
  { id: 'canvas-eraser', label: 'Canvas: eraser', group: 'canvas', defaultBinding: 'E' },
  { id: 'canvas-delete', label: 'Canvas: delete selection', group: 'canvas', defaultBinding: 'Delete' },
  { id: 'canvas-group', label: 'Canvas: group', group: 'canvas', defaultBinding: 'Ctrl+G', allowInInput: true },
  { id: 'canvas-ungroup', label: 'Canvas: ungroup', group: 'canvas', defaultBinding: 'Ctrl+Shift+G', allowInInput: true },
  { id: 'canvas-center', label: 'Canvas: fit to content', group: 'canvas', defaultBinding: 'Shift+1', allowInInput: true },
  { id: 'canvas-reset-zoom', label: 'Canvas: reset zoom', group: 'canvas', defaultBinding: 'Shift+0', allowInInput: true },
  { id: 'canvas-search', label: 'Canvas: search objects', group: 'canvas', defaultBinding: 'Ctrl+F', allowInInput: true },
]

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const
type Modifier = (typeof MODIFIER_ORDER)[number]

const KEY_ALIASES: Record<string, string> = {
  ' ': 'Space',
  spacebar: 'Space',
  esc: 'Escape',
  escape: 'Escape',
  del: 'Delete',
  delete: 'Delete',
  backspace: 'Backspace',
  return: 'Enter',
  enter: 'Enter',
  tab: 'Tab',
  ',' : ',',
  '.': '.',
  ';': ';',
  '=': '=',
  '-': '-',
  '[': '[',
  ']': ']',
  '/': '/',
  '\\': '\\',
  '`': '`',
}

function normalizeKey(key: string): string {
  const lower = key.toLowerCase()
  if (KEY_ALIASES[lower]) return KEY_ALIASES[lower]
  if (lower === 'control') return 'Ctrl'
  if (lower === 'alt') return 'Alt'
  if (lower === 'shift') return 'Shift'
  if (lower === 'meta' || lower === 'os') return 'Meta'
  if (key.length === 1) return key.toUpperCase()
  return key
}

/** Convert a KeyboardEvent into our canonical binding string. */
export function eventToBinding(e: KeyboardEvent): string | null {
  const key = normalizeKey(e.key)
  if (key === 'Ctrl' || key === 'Alt' || key === 'Shift' || key === 'Meta') return null

  const mods: Modifier[] = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Meta')

  // Letters used purely as modifiers (AltGr etc.) or unknown keys with no mods.
  if (!mods.length && key.length > 1 && !['Tab', 'Escape', 'Delete', 'Backspace', 'Enter', 'Space', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key) && !key.startsWith('Arrow')) {
    return null
  }

  return [...mods, key].join('+')
}

export function normalizeBinding(binding: string): string | null {
  const parts = binding
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
  if (!parts.length) return null
  const mods = new Set<Modifier>()
  let key: string | null = null
  for (const part of parts) {
    const n = normalizeKey(part)
    if (n === 'Ctrl' || n === 'Alt' || n === 'Shift' || n === 'Meta') mods.add(n)
    else key = n
  }
  if (!key) return null
  return [
    ...MODIFIER_ORDER.filter((m) => mods.has(m)),
    key,
  ].join('+')
}

/** Pretty-print a binding: `Ctrl+Shift+N` -> `Ctrl + Shift + N`. */
export function formatBinding(binding: string | undefined): string {
  if (!binding) return ''
  return binding.split('+').join(' + ')
}

export function matchesBinding(binding: string | undefined, e: KeyboardEvent): boolean {
  if (!binding) return false
  const normalized = normalizeBinding(binding)
  if (!normalized) return false
  return eventToBinding(e) === normalized
}

export function resolveBindings(
  overrides: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const def of SHORTCUT_DEFS) {
    const override = overrides[def.id]
    result[def.id] = override !== undefined ? override : def.defaultBinding
  }
  return result
}

export interface ShortcutConflict {
  binding: string
  ids: string[]
}

/** Find bindings used by more than one action. */
export function findConflicts(
  bindings: Record<string, string>,
): ShortcutConflict[] {
  const byBinding = new Map<string, string[]>()
  for (const [id, binding] of Object.entries(bindings)) {
    if (!binding) continue
    const normalized = normalizeBinding(binding)
    if (!normalized) continue
    const list = byBinding.get(normalized) ?? []
    list.push(id)
    byBinding.set(normalized, list)
  }
  return [...byBinding.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([binding, ids]) => ({ binding, ids }))
}

export function shortcutLabel(
  id: string,
  t: (key: string, fallback?: string) => string,
): string {
  const def = SHORTCUT_DEFS.find((d) => d.id === id)
  if (!def) return id
  return t(`shortcut.${id}`, def.label)
}

export const isEditableTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (el.isContentEditable) return true
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return false
}
