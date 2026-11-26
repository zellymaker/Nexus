/**
 * Plain helpers for the Settings module: value formatting, local storage
 * inspection, backup export/import, clipboard access and font availability.
 *
 * Kept free of React so the sections stay declarative and these helpers are
 * trivially testable.
 */

import { sanitizeHtml } from '../lib/sanitize'
import { DEFAULT_SETTINGS, THEMES, clamp } from '../lib/settings'

export const NEXUS_PREFIX = 'nexus:'

/** Persisted zustand workspace state — the only entry containing HTML. */
const STORE_KEY = 'nexus:store:v1'

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */

/** Replace `{name}` placeholders in a translated string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(2) : mb.toFixed(1)} MB`
}

const pad2 = (value: number) => String(value).padStart(2, '0')

/** Local calendar date used in backup file names: `2026-11-26`. */
export function dateStamp(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Wall-clock time used in the diagnostics log. */
export function formatTime(at: number): string {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return ''
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

/** Milliseconds -> localized "500 мс" / "2 с" label. */
export function formatDelay(ms: number, t: (key: string, fallback?: string) => string): string {
  if (ms >= 1000) return `${ms / 1000} ${t('settings.unit.sec', 's')}`
  return `${ms} ${t('settings.unit.ms', 'ms')}`
}

/** Font stack matching `lib/theme.ts` so previews look like the real UI. */
export function cssFontStack(family: string): string {
  const fallback =
    family === 'monospace' || family.includes('Mono')
      ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
      : "'Inter Variable', Inter, system-ui, sans-serif"
  if (family === 'system-ui' || family === 'monospace') return fallback
  return `'${family}', ${fallback}`
}

/* ------------------------------------------------------------------ */
/*  Local storage                                                      */
/* ------------------------------------------------------------------ */

export interface StorageEntry {
  key: string
  bytes: number
}

export interface StorageInfo {
  entries: StorageEntry[]
  totalBytes: number
}

/** Every `localStorage` key owned by NEXUS, with its approximate byte size. */
export function readNexusStorage(): StorageInfo {
  const entries: StorageEntry[] = []
  let totalBytes = 0
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key || !key.startsWith(NEXUS_PREFIX)) continue
      const value = localStorage.getItem(key) ?? ''
      const bytes = new Blob([key, value]).size
      entries.push({ key, bytes })
      totalBytes += bytes
    }
  } catch {
    return { entries: [], totalBytes: 0 }
  }
  entries.sort((a, b) => b.bytes - a.bytes)
  return { entries, totalBytes }
}

export function collectNexusKeys(): Record<string, string> {
  const keys: Record<string, string> = {}
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key || !key.startsWith(NEXUS_PREFIX)) continue
      const value = localStorage.getItem(key)
      if (value !== null) keys[key] = value
    }
  } catch {
    return {}
  }
  return keys
}

/* ------------------------------------------------------------------ */
/*  Backup                                                             */
/* ------------------------------------------------------------------ */

export interface BackupFile {
  app: 'nexus'
  format: 1
  exportedAt: string
  keys: Record<string, string>
}

/**
 * Write a JSON backup of every `nexus:*` key and trigger the browser download.
 * Returns the number of exported keys (0 when there is nothing to export).
 */
export function downloadBackup(): number {
  const keys = collectNexusKeys()
  const count = Object.keys(keys).length
  const payload: BackupFile = {
    app: 'nexus',
    format: 1,
    exportedAt: new Date().toISOString(),
    keys,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `nexus-backup-${dateStamp()}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return count
}

export interface ParsedBackup {
  keys: Record<string, string>
  count: number
}

/**
 * Parse and validate a backup file. Accepts both the `{ app, format, keys }`
 * envelope written by `downloadBackup` and a flat `{ 'nexus:…': '…' }` record.
 * Returns `null` when the payload is not a NEXUS backup.
 */
export function parseBackup(raw: string): ParsedBackup | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const record = data as Record<string, unknown>
  const envelopeKeys = record.keys
  const source: Record<string, unknown> =
    envelopeKeys && typeof envelopeKeys === 'object' && !Array.isArray(envelopeKeys)
      ? (envelopeKeys as Record<string, unknown>)
      : record

  const keys: Record<string, string> = {}
  for (const [key, value] of Object.entries(source)) {
    if (!key.startsWith(NEXUS_PREFIX)) continue
    if (typeof value !== 'string') return null
    keys[key] = value
  }
  const count = Object.keys(keys).length
  return count ? { keys, count } : null
}

/** Overwrite the given `nexus:*` keys. Returns false when storage is blocked. */
export function applyBackup(keys: Record<string, string>): boolean {
  try {
    for (const [key, value] of Object.entries(keys)) {
      if (!key.startsWith(NEXUS_PREFIX)) continue
      localStorage.setItem(key, value)
    }
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Backup validation / sanitisation                                   */
/* ------------------------------------------------------------------ */

/** Hard cap for an imported backup file (export writes a single JSON blob). */
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024

const CANVAS_KEY = 'nexus:canvas:v1'

const SETTINGS_SECTIONS = [
  'general',
  'appearance',
  'typography',
  'editor',
  'workspace',
  'privacy',
  'shortcuts',
  'about',
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

/** Font families become part of a CSS custom property, keep them boring. */
const SAFE_FONT = /^[\w .-]{1,64}$/

function enumField(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  fallback: string,
): number {
  const value = record[key]
  if (typeof value === 'string' && allowed.includes(value)) return 0
  record[key] = fallback
  return 1
}

function numberField(
  record: Record<string, unknown>,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = record[key]
  if (!isFiniteNumber(value)) {
    record[key] = fallback
    return 1
  }
  const next = clamp(value, min, max)
  if (next === value) return 0
  record[key] = next
  return 1
}

function integerField(
  record: Record<string, unknown>,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = record[key]
  if (!isFiniteNumber(value)) {
    record[key] = fallback
    return 1
  }
  const next = Math.round(clamp(value, min, max))
  if (next === value) return 0
  record[key] = next
  return 1
}

function booleanField(
  record: Record<string, unknown>,
  key: string,
  fallback: boolean,
): number {
  if (isBoolean(record[key])) return 0
  record[key] = fallback
  return 1
}

function fontField(
  record: Record<string, unknown>,
  key: string,
  fallback: string,
): number {
  const value = record[key]
  if (typeof value === 'string' && SAFE_FONT.test(value)) return 0
  record[key] = fallback
  return 1
}

function groupField(
  record: Record<string, unknown>,
  key: string,
  fallback: object,
  sanitize: (value: Record<string, unknown>) => number,
): number {
  const value = record[key]
  if (!isRecord(value)) {
    record[key] = { ...fallback }
    return 1
  }
  return sanitize(value)
}

function sanitizeShortcuts(record: Record<string, unknown>): number {
  const value = record.shortcuts
  if (!isRecord(value)) {
    record.shortcuts = {}
    return 1
  }
  let changes = 0
  for (const [id, binding] of Object.entries(value)) {
    // bindings are plain printable tokens ("Ctrl+Shift+N")
    if (typeof binding !== 'string' || binding.length > 48 || !/^[\x20-\x7E]+$/.test(binding)) {
      delete value[id]
      changes += 1
    }
  }
  return changes
}

function sanitizeTypography(record: Record<string, unknown>): number {
  const defaults = DEFAULT_SETTINGS.typography
  return (
    fontField(record, 'uiFont', defaults.uiFont) +
    fontField(record, 'editorFont', defaults.editorFont) +
    fontField(record, 'monoFont', defaults.monoFont) +
    numberField(record, 'baseSize', defaults.baseSize, 10, 24) +
    numberField(record, 'lineHeight', defaults.lineHeight, 1, 2.5) +
    numberField(record, 'fontWeight', defaults.fontWeight, 100, 900)
  )
}

function sanitizeEditor(record: Record<string, unknown>): number {
  const defaults = DEFAULT_SETTINGS.editor
  return (
    numberField(record, 'fontSize', defaults.fontSize, 8, 40) +
    numberField(record, 'lineHeight', defaults.lineHeight, 1, 2.5) +
    booleanField(record, 'wrap', defaults.wrap) +
    booleanField(record, 'lineNumbers', defaults.lineNumbers) +
    booleanField(record, 'syntaxHighlight', defaults.syntaxHighlight) +
    enumField(record, 'cursorStyle', ['bar', 'underline', 'block'], defaults.cursorStyle) +
    integerField(record, 'tabSize', defaults.tabSize, 1, 8)
  )
}

function sanitizeWorkspace(record: Record<string, unknown>): number {
  const defaults = DEFAULT_SETTINGS.workspace
  return (
    booleanField(record, 'confirmDelete', defaults.confirmDelete) +
    enumField(record, 'startup', ['restore', 'home'], defaults.startup) +
    booleanField(record, 'autosave', defaults.autosave) +
    integerField(record, 'autosaveDelay', defaults.autosaveDelay, 0, 60_000) +
    enumField(record, 'sortFiles', ['name', 'modified', 'created'], defaults.sortFiles) +
    enumField(record, 'sortFolders', ['name', 'modified', 'created'], defaults.sortFolders) +
    booleanField(record, 'showHidden', defaults.showHidden) +
    booleanField(record, 'expandOnClick', defaults.expandOnClick) +
    booleanField(record, 'revealActive', defaults.revealActive)
  )
}

function sanitizeNotifications(record: Record<string, unknown>): number {
  const defaults = DEFAULT_SETTINGS.notifications
  return (
    booleanField(record, 'toasts', defaults.toasts) +
    integerField(record, 'duration', defaults.duration, 0, 60_000)
  )
}

function sanitizePrivacy(record: Record<string, unknown>): number {
  let changes =
    booleanField(record, 'diagnostics', DEFAULT_SETTINGS.privacy.diagnostics) +
    booleanField(record, 'diagnosticsPaths', DEFAULT_SETTINGS.privacy.diagnosticsPaths)
  // stale one-shot flag, never restore it from a backup
  if (record.clearDiagnostics !== false) {
    record.clearDiagnostics = false
    changes += 1
  }
  return changes
}

function sanitizeSettings(record: Record<string, unknown>): number {
  let changes = 0
  changes += enumField(record, 'language', ['ru', 'en'], DEFAULT_SETTINGS.language)
  changes += enumField(
    record,
    'theme',
    [...THEMES.map((theme) => theme.id), 'system'],
    DEFAULT_SETTINGS.theme,
  )
  changes += numberField(record, 'uiScale', DEFAULT_SETTINGS.uiScale, 0.85, 1.25)
  changes += enumField(record, 'density', ['comfortable', 'compact'], DEFAULT_SETTINGS.density)
  changes += enumField(record, 'motion', ['system', 'full', 'reduced'], DEFAULT_SETTINGS.motion)
  changes += booleanField(record, 'animations', DEFAULT_SETTINGS.animations)
  changes += groupField(record, 'typography', DEFAULT_SETTINGS.typography, sanitizeTypography)
  changes += groupField(record, 'editor', DEFAULT_SETTINGS.editor, sanitizeEditor)
  changes += groupField(record, 'workspace', DEFAULT_SETTINGS.workspace, sanitizeWorkspace)
  changes += groupField(record, 'notifications', DEFAULT_SETTINGS.notifications, sanitizeNotifications)
  changes += groupField(record, 'privacy', DEFAULT_SETTINGS.privacy, sanitizePrivacy)
  changes += sanitizeShortcuts(record)
  return changes
}

function sanitizeView(view: Record<string, unknown>): boolean {
  switch (view.kind) {
    case 'note':
    case 'canvas':
      return true
    case 'list':
      if (typeof view.title !== 'string') return false
      if (
        view.filter !== 'all' &&
        view.filter !== 'favorites' &&
        view.filter !== 'recent' &&
        view.filter !== 'folder'
      ) {
        return false
      }
      if (view.folderId !== undefined && typeof view.folderId !== 'string') return false
      return true
    case 'settings': {
      const section = view.section
      if (typeof section !== 'string' || !(SETTINGS_SECTIONS as readonly string[]).includes(section)) {
        view.section = 'general'
      }
      return true
    }
    default:
      return false
  }
}

interface SanitizedStorePayload {
  json: string
  sanitizedNotes: number
  adjustedSettings: number
}

function sanitizeStorePayload(raw: string): SanitizedStorePayload | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(parsed)) return null

  const state = parsed.state
  if (!isRecord(state)) return null
  const nodes = state.nodes
  if (!isRecord(nodes)) return null

  let sanitizedNotes = 0
  for (const value of Object.values(nodes)) {
    if (!isRecord(value)) return null
    if (value.kind !== 'note' && value.kind !== 'folder') return null
    if (typeof value.id !== 'string' || typeof value.name !== 'string') return null
    if (!isStringArray(value.childIds)) return null
    if (value.parentId !== null && typeof value.parentId !== 'string') return null
    if (!isFiniteNumber(value.createdAt) || !isFiniteNumber(value.updatedAt)) return null
    if (value.kind === 'note') {
      const content = typeof value.content === 'string' ? value.content : ''
      const clean = sanitizeHtml(content)
      if (clean !== content) sanitizedNotes += 1
      value.content = clean
    }
  }

  if (!isStringArray(state.rootIds) || !isStringArray(state.tabs)) return null
  if (typeof state.activeTabId !== 'string') return null
  if (state.favorites !== undefined && !isStringArray(state.favorites)) return null
  if (state.expanded !== undefined && !isRecord(state.expanded)) return null
  if (!isBoolean(state.leftOpen) || !isBoolean(state.rightOpen)) return null
  if (!isRecord(state.view) || !sanitizeView(state.view)) return null
  if (typeof state.activeNav !== 'string') return null
  if (!isRecord(state.settings)) return null
  const adjustedSettings = sanitizeSettings(state.settings)

  return { json: JSON.stringify(parsed), sanitizedNotes, adjustedSettings }
}

const CONNECTION_ANCHORS = ['top', 'right', 'bottom', 'left', 'center']
const SAFE_IMAGE_SRC = /^(data:image\/|blob:|https?:\/|\/)/i

function isValidConnectionEnd(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.objectId === 'string' &&
    typeof value.anchor === 'string' &&
    CONNECTION_ANCHORS.includes(value.anchor)
  )
}

function isValidCanvasObject(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.kind !== 'string') return false
  if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y)) return false
  if (!isFiniteNumber(value.width) || !isFiniteNumber(value.height)) return false
  if (value.width < 0 || value.height < 0) return false
  if (!isFiniteNumber(value.rotation) || !isFiniteNumber(value.opacity)) return false
  if (value.opacity < 0 || value.opacity > 1) return false
  switch (value.kind) {
    case 'sticky':
    case 'text':
      return typeof value.text === 'string'
    case 'rect':
    case 'ellipse':
      return true
    case 'draw':
      return Array.isArray(value.points) && value.points.every(isFiniteNumber)
    case 'image':
      return typeof value.src === 'string' && SAFE_IMAGE_SRC.test(value.src)
    case 'document':
      return typeof value.nodeId === 'string'
    default:
      return false
  }
}

function isValidCanvasDoc(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false
  if (!isFiniteNumber(value.createdAt) || !isFiniteNumber(value.updatedAt)) return false
  if (!Array.isArray(value.objects) || !value.objects.every(isValidCanvasObject)) return false
  if (!Array.isArray(value.connections)) return false
  for (const connection of value.connections) {
    if (
      !isRecord(connection) ||
      typeof connection.id !== 'string' ||
      !isValidConnectionEnd(connection.from) ||
      !isValidConnectionEnd(connection.to) ||
      typeof connection.stroke !== 'string' ||
      !isFiniteNumber(connection.strokeWidth) ||
      !isBoolean(connection.arrow) ||
      !isBoolean(connection.dashed)
    ) {
      return false
    }
  }
  const viewport = value.viewport
  if (
    !isRecord(viewport) ||
    !isFiniteNumber(viewport.x) ||
    !isFiniteNumber(viewport.y) ||
    !isFiniteNumber(viewport.scale) ||
    viewport.scale <= 0
  ) {
    return false
  }
  return true
}

/** Structural validation of the canvas payload (no HTML surface: Konva draws). */
function isValidCanvasPayload(raw: string): boolean {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return false
  }
  if (!isRecord(parsed)) return false
  const state = parsed.state
  if (!isRecord(state)) return false
  if (!Array.isArray(state.canvases) || !state.canvases.every(isValidCanvasDoc)) return false
  if (typeof state.activeCanvasId !== 'string') return false
  return true
}

export interface SanitizedBackup {
  keys: Record<string, string>
  /** Notes whose HTML was changed by the allow-list sanitizer. */
  sanitizedNotes: number
  /** Settings fields that were reset to safe defaults / clamped. */
  adjustedSettings: number
  /** `nexus:canvas:v1` was structurally invalid and is not imported. */
  skippedCanvas: boolean
}

/**
 * Validate and sanitise an imported backup *before* its keys are written to
 * `localStorage`:
 *
 *  - `nexus:store:v1`: structural validation, HTML sanitisation of every note
 *    body, enum/clamp normalisation of settings (language, theme, scale, …)
 *    and string-only shortcut overrides;
 *  - `nexus:canvas:v1`: structural validation of the canvas document tree
 *    (objects, connections, viewport, image URLs). A malformed canvas payload
 *    is dropped from the import (the current canvas stays untouched) and
 *    reported to the user — the workspace part is still restored.
 *
 * Returns `null` only when the workspace payload is invalid; the caller must
 * then abort the whole import.
 */
export function sanitizeBackup(keys: Record<string, string>): SanitizedBackup | null {
  const nextKeys: Record<string, string> = { ...keys }
  let sanitizedNotes = 0
  let adjustedSettings = 0

  const storeRaw = keys[STORE_KEY]
  if (storeRaw !== undefined) {
    const store = sanitizeStorePayload(storeRaw)
    if (!store) return null
    nextKeys[STORE_KEY] = store.json
    sanitizedNotes = store.sanitizedNotes
    adjustedSettings = store.adjustedSettings
  }

  let skippedCanvas = false
  const canvasRaw = keys[CANVAS_KEY]
  if (canvasRaw !== undefined && !isValidCanvasPayload(canvasRaw)) {
    // keep the existing canvas instead of importing an untrusted/corrupted one
    delete nextKeys[CANVAS_KEY]
    skippedCanvas = true
  }

  return { keys: nextKeys, sanitizedNotes, adjustedSettings, skippedCanvas }
}

/* ------------------------------------------------------------------ */
/*  Clipboard                                                          */
/* ------------------------------------------------------------------ */

/** Copy text, falling back to a hidden textarea in WebViews. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/* ------------------------------------------------------------------ */

const GENERIC_FAMILIES = new Set([
  'system-ui',
  'ui-sans-serif',
  'ui-monospace',
  'monospace',
  'sans-serif',
  'serif',
])

/**
 * Heuristic font availability check used for the fallback warning in
 * Typography. Generic families are always considered available.
 */
export function isFontAvailable(family: string): boolean {
  if (!family || GENERIC_FAMILIES.has(family)) return true
  if (typeof document === 'undefined' || !document.fonts) return true
  try {
    return document.fonts.check(`14px '${family.replace(/'/g, "\\'")}'`)
  } catch {
    return true
  }
}
