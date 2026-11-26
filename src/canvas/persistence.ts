/**
 * Canvas persistence layer.
 *
 * The store is persisted to localStorage under `nexus:canvas:v1` with a ~300 ms
 * debounce. This module also normalises whatever payload is found there — the
 * current id-keyed record, legacy array shapes or a foreign object — into
 * valid canvas documents with an active id that always exists.
 */
import type { StateStorage } from 'zustand/middleware'
import type { CanvasDoc, CanvasObject, Connection, Viewport } from './types'
import { pruneConnections } from './utils/connections'
import { markDirty, markSaved } from './saveStatus'

const SAVE_DEBOUNCE = 300


const pending = new Map<string, string>()
let flushTimer: number | undefined

function flushCanvasStorage() {
  if (flushTimer !== undefined) {
    window.clearTimeout(flushTimer)
    flushTimer = undefined
  }
  for (const [key, value] of pending) {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('[nexus:canvas] unable to persist state', error)
    }
  }
  pending.clear()
  markSaved()
}

export const canvasStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    markDirty()
    pending.set(name, value)
    if (flushTimer !== undefined) window.clearTimeout(flushTimer)
    flushTimer = window.setTimeout(flushCanvasStorage, SAVE_DEBOUNCE)
  },
  removeItem: (name) => {
    pending.delete(name)
    try {
      localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushCanvasStorage)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushCanvasStorage()
  })
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 }
const KNOWN_OBJECT_KINDS = [
  'sticky',
  'text',
  'rect',
  'ellipse',
  'draw',
  'image',
  'document',
]

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

function normalizeViewport(raw: unknown): Viewport {
  if (!isRecord(raw)) return { ...DEFAULT_VIEWPORT }
  return {
    x: numberOr(raw.x, 0),
    y: numberOr(raw.y, 0),
    scale: Math.min(4, Math.max(0.1, numberOr(raw.scale, 1))),
  }
}

function normalizeObjects(raw: unknown): CanvasObject[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is CanvasObject =>
      isRecord(item) &&
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.kind === 'string' &&
      KNOWN_OBJECT_KINDS.includes(item.kind),
  )
}

function normalizeConnections(raw: unknown): Connection[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is Connection => {
    if (!isRecord(item) || typeof item.id !== 'string') return false
    if (!isRecord(item.from) || !isRecord(item.to)) return false
    return (
      typeof item.from.objectId === 'string' && typeof item.to.objectId === 'string'
    )
  })
}

function normalizeCanvasDoc(raw: unknown, index: number): CanvasDoc | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  const objects = normalizeObjects(raw.objects)
  const connections = pruneConnections(normalizeConnections(raw.connections), objects)
  const now = Date.now()
  return {
    id: raw.id,
    name:
      typeof raw.name === 'string' && raw.name.trim().length
        ? raw.name
        : `Canvas ${index + 1}`,
    createdAt: numberOr(raw.createdAt, now),
    updatedAt: numberOr(raw.updatedAt, now),
    objects,
    connections,
    viewport: normalizeViewport(raw.viewport),
  }
}

/**
 * Accepts both the current array shape and legacy/foreign record-shaped
 * storage (`{"0": {...}, "1": {...}}`), drops malformed entries and repairs
 * every canvas' viewport.
 */
export function normalizeCanvases(raw: unknown): CanvasDoc[] {
  const entries = Array.isArray(raw)
    ? raw
    : isRecord(raw)
      ? Object.values(raw)
      : []
  return entries
    .map((entry, index) => normalizeCanvasDoc(entry, index))
    .filter((canvas): canvas is CanvasDoc => canvas !== null)
}

/**
 * Persisted contract: canvases are keyed by id, so
 * `state.canvases[state.activeCanvasId]` always resolves to the open board, and
 * `activeCanvasId` is validated on every write / rehydration.
 */
export interface PersistedCanvasState {
  canvases: Record<string, CanvasDoc>
  activeCanvasId: string
}

export interface NormalizedCanvasState {
  canvases: CanvasDoc[]
  activeCanvasId: string
}

const validActiveId = (canvases: CanvasDoc[], candidate: unknown): string =>
  typeof candidate === 'string' && canvases.some((canvas) => canvas.id === candidate)
    ? candidate
    : (canvases[0]?.id ?? '')

/** Normalise any persisted payload (array, record, legacy) to in-memory state. */
export function normalizePersistedCanvasState(raw: unknown): NormalizedCanvasState {
  const record = isRecord(raw) ? raw : {}
  const canvases = normalizeCanvases(record.canvases)
  return { canvases, activeCanvasId: validActiveId(canvases, record.activeCanvasId) }
}

/** In-memory array -> persisted id-keyed record with a valid active id. */
export function toPersistedCanvasState(
  canvases: CanvasDoc[],
  activeCanvasId: unknown,
): PersistedCanvasState {
  const record: Record<string, CanvasDoc> = {}
  for (const canvas of canvases) record[canvas.id] = canvas
  return { canvases: record, activeCanvasId: validActiveId(canvases, activeCanvasId) }
}

