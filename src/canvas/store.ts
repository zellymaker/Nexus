/**
 * Canvas module store — the whiteboard's own single source of truth.
 *
 * Persisted to localStorage under `nexus:canvas:v1` (debounced ~300 ms):
 * canvases, their objects / connections / viewport and the active canvas.
 * Ephemeral: selection, active tool, inline editing, undo history, clipboard.
 *
 * The main workspace store (`lib/store.ts`) is never written from here.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  AlignMode,
  Bounds,
  CanvasDoc,
  CanvasHistory,
  CanvasObject,
  CanvasSnapshot,
  Connection,
  ObjectUpdate,
  ShapeKind,
  Tool,
  Viewport,
} from './types'
import { createSeedCanvases } from './seed'
import {
  canvasStorage,
  isRecord,
  normalizeCanvases,
  normalizePersistedCanvasState,
  toPersistedCanvasState,
} from './persistence'
import type { PersistedCanvasState } from './persistence'
import { objectBounds, objectsBounds } from './utils/geometry'
import {
  copyConnection,
  copyObjectData,
  duplicateObject,
  expandGroupIds,
  uid,
} from './utils/objects'
import { pruneConnections } from './utils/connections'

export const HISTORY_LIMIT = 40
const COALESCE_MS = 700

interface HistoryOptions {
  history?: boolean
  key?: string
}

interface CanvasClipboard {
  objects: CanvasObject[]
  connections: Connection[]
}

let clipboard: CanvasClipboard | null = null

export const hasCanvasClipboard = (): boolean => clipboard !== null

export interface CanvasStoreState {
  canvases: CanvasDoc[]
  activeCanvasId: string

  /* ephemeral ------------------------------------------------- */
  selection: string[]
  tool: Tool
  lastShape: ShapeKind
  editingId: string | null
  history: Record<string, CanvasHistory>

  /* canvases -------------------------------------------------- */
  createCanvas: (name?: string) => string
  renameCanvas: (id: string, name: string) => void
  deleteCanvas: (id: string) => void
  setActiveCanvas: (id: string) => void
  setViewport: (viewport: Viewport) => void

  /* tools & selection ----------------------------------------- */
  setTool: (tool: Tool) => void
  setEditing: (id: string | null) => void
  select: (ids: string[], additive?: boolean) => void
  selectAll: () => void
  clearSelection: () => void

  /* objects --------------------------------------------------- */
  pushHistory: (coalesceKey?: string) => void
  updateObjects: (updates: ObjectUpdate[], options?: HistoryOptions) => void
  replaceObjects: (objects: CanvasObject[], options?: HistoryOptions) => void
  addObjects: (objects: CanvasObject[]) => void
  addConnection: (connection: Connection) => void
  updateConnection: (id: string, patch: Partial<Connection>, options?: HistoryOptions) => void
  deleteIds: (ids: string[]) => void
  deleteSelection: () => void

  /* editing commands ------------------------------------------ */
  duplicateSelection: () => void
  copySelection: () => void
  paste: () => void
  align: (mode: AlignMode, viewRect: Bounds) => void
  zOrder: (mode: 'front' | 'back') => void
  groupSelection: () => void
  ungroupSelection: () => void

  /* history --------------------------------------------------- */
  undo: () => void
  redo: () => void
}

/* ------------------------------------------------------------------ */
/*  Rehydration guards                                                 */
/* ------------------------------------------------------------------ */

const migratePersisted = (persisted: unknown): PersistedCanvasState => {
  const normalized = normalizePersistedCanvasState(persisted)
  return toPersistedCanvasState(normalized.canvases, normalized.activeCanvasId)
}

const mergePersisted = (
  persisted: unknown,
  current: CanvasStoreState,
): CanvasStoreState => {
  if (!isRecord(persisted)) return current
  // A payload without any canvases key (e.g. hand-written fixtures) must not
  // wipe the seed boards.
  if (!('canvases' in persisted)) return current
  const { canvases, activeCanvasId } = normalizePersistedCanvasState(persisted)
  return {
    ...current,
    canvases,
    activeCanvasId,
    selection: [],
    editingId: null,
    history: {},
    tool: 'select',
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

const seedCanvases = createSeedCanvases()
const seedActiveCanvasId = seedCanvases[0]?.id ?? ''

export const useCanvasStore = create<CanvasStoreState>()(
  persist(
    (set, get) => {
      let lastCoalesce: { key: string; at: number } | null = null

      const findActive = (): CanvasDoc | undefined => {
        const state = get()
        return state.canvases.find((canvas) => canvas.id === state.activeCanvasId)
      }

      const mutateActive = (updater: (canvas: CanvasDoc) => CanvasDoc): void => {
        set((state) => ({
          canvases: state.canvases.map((canvas) =>
            canvas.id === state.activeCanvasId
              ? { ...updater(canvas), updatedAt: Date.now() }
              : canvas,
          ),
        }))
      }

      const snapshot = (canvas: CanvasDoc): CanvasSnapshot => ({
        objects: canvas.objects.map(copyObjectData),
        connections: canvas.connections.map(copyConnection),
      })

      const recordHistory = (coalesceKey?: string): void => {
        const state = get()
        const canvas = state.canvases.find((item) => item.id === state.activeCanvasId)
        if (!canvas) return
        const now = Date.now()
        if (
          coalesceKey &&
          lastCoalesce &&
          lastCoalesce.key === coalesceKey &&
          now - lastCoalesce.at < COALESCE_MS
        ) {
          lastCoalesce.at = now
          return
        }
        lastCoalesce = coalesceKey ? { key: coalesceKey, at: now } : null
        const history: CanvasHistory = state.history[state.activeCanvasId] ?? {
          past: [],
          future: [],
        }
        set({
          history: {
            ...state.history,
            [state.activeCanvasId]: {
              past: [...history.past, snapshot(canvas)].slice(-HISTORY_LIMIT),
              future: [],
            },
          },
        })
      }

      const applyHistory = (next: CanvasHistory): void => {
        set((state) => ({
          history: { ...state.history, [state.activeCanvasId]: next },
        }))
      }

      return {
        canvases: seedCanvases,
        activeCanvasId: seedActiveCanvasId,
        selection: [],
        tool: 'select',
        lastShape: 'rect',
        editingId: null,
        history: {},

        /* ----------------------- canvases ----------------------- */

        createCanvas: (name) => {
          const state = get()
          const now = Date.now()
          const canvas: CanvasDoc = {
            id: uid(),
            name: name?.trim() || `Canvas ${state.canvases.length + 1}`,
            createdAt: now,
            updatedAt: now,
            objects: [],
            connections: [],
            viewport: { x: 0, y: 0, scale: 1 },
          }
          set({
            canvases: [...state.canvases, canvas],
            activeCanvasId: canvas.id,
            selection: [],
            editingId: null,
            tool: 'select',
          })
          return canvas.id
        },

        renameCanvas: (id, name) => {
          const trimmed = name.trim()
          if (!trimmed) return
          set((state) => ({
            canvases: state.canvases.map((canvas) =>
              canvas.id === id ? { ...canvas, name: trimmed, updatedAt: Date.now() } : canvas,
            ),
          }))
        },

        deleteCanvas: (id) => {
          const state = get()
          if (!state.canvases.some((canvas) => canvas.id === id)) return
          const canvases = state.canvases.filter((canvas) => canvas.id !== id)
          const history = { ...state.history }
          delete history[id]
          set({
            canvases,
            activeCanvasId:
              state.activeCanvasId === id ? (canvases[0]?.id ?? '') : state.activeCanvasId,
            history,
            selection: [],
            editingId: null,
          })
        },

        setActiveCanvas: (id) => {
          if (!get().canvases.some((canvas) => canvas.id === id)) return
          set({ activeCanvasId: id, selection: [], editingId: null })
        },

        setViewport: (viewport) => {
          mutateActive((canvas) => ({ ...canvas, viewport: { ...viewport } }))
        },

        /* ----------------------- tools -------------------------- */

        setTool: (tool) => {
          set((state) => ({
            tool,
            lastShape: tool === 'rect' || tool === 'ellipse' ? tool : state.lastShape,
            editingId: null,
            selection: tool === 'select' || tool === 'hand' ? state.selection : [],
          }))
        },

        setEditing: (id) => set({ editingId: id }),

        select: (ids, additive = false) => {
          const state = get()
          const canvas = state.canvases.find((item) => item.id === state.activeCanvasId)
          if (!canvas) {
            set({ selection: [] })
            return
          }
          const expanded = expandGroupIds(canvas.objects, ids)
          if (!additive) {
            set({ selection: expanded, editingId: null })
            return
          }
          const next = new Set(state.selection)
          const fullySelected = expanded.every((id) => next.has(id))
          for (const id of expanded) {
            if (fullySelected) next.delete(id)
            else next.add(id)
          }
          set({ selection: [...next], editingId: null })
        },

        selectAll: () => {
          const canvas = findActive()
          if (!canvas) return
          set({
            selection: [
              ...canvas.objects.map((object) => object.id),
              ...canvas.connections.map((connection) => connection.id),
            ],
            editingId: null,
          })
        },

        clearSelection: () => set({ selection: [], editingId: null }),

        /* ----------------------- objects ------------------------ */

        pushHistory: (coalesceKey) => recordHistory(coalesceKey),

        updateObjects: (updates, options) => {
          if (!updates.length) return
          if (options?.history) recordHistory(options.key)
          const patches = new Map(updates.map((update) => [update.id, update.patch]))
          mutateActive((canvas) => ({
            ...canvas,
            objects: canvas.objects.map((object) => {
              const patch = patches.get(object.id)
              return patch ? ({ ...object, ...patch } as CanvasObject) : object
            }),
          }))
        },

        replaceObjects: (objects, options) => {
          if (!objects.length) return
          if (options?.history) recordHistory(options.key)
          const replacements = new Map(objects.map((object) => [object.id, object]))
          mutateActive((canvas) => ({
            ...canvas,
            objects: canvas.objects.map((object) => replacements.get(object.id) ?? object),
          }))
        },

        addObjects: (objects) => {
          if (!objects.length) return
          recordHistory()
          mutateActive((canvas) => ({ ...canvas, objects: [...canvas.objects, ...objects] }))
          set({ selection: objects.map((object) => object.id) })
        },

        addConnection: (connection) => {
          recordHistory()
          mutateActive((canvas) => ({
            ...canvas,
            connections: [...canvas.connections, connection],
          }))
          set({ selection: [connection.id] })
        },

        updateConnection: (id, patch, options) => {
          if (options?.history) recordHistory(options.key)
          mutateActive((canvas) => ({
            ...canvas,
            connections: canvas.connections.map((connection) =>
              connection.id === id ? { ...connection, ...patch } : connection,
            ),
          }))
        },

        deleteIds: (ids) => {
          const canvas = findActive()
          if (!canvas || !ids.length) return
          const idSet = new Set(ids)
          const objectIds = new Set<string>()
          for (const object of canvas.objects) {
            if (idSet.has(object.id)) objectIds.add(object.id)
          }
          const connectionIds = new Set<string>()
          for (const connection of canvas.connections) {
            if (idSet.has(connection.id)) connectionIds.add(connection.id)
          }
          if (!objectIds.size && !connectionIds.size) return
          recordHistory()
          mutateActive((current) => {
            const objects = current.objects.filter((object) => !objectIds.has(object.id))
            const connections = pruneConnections(
              current.connections.filter((connection) => !connectionIds.has(connection.id)),
              objects,
            )
            return { ...current, objects, connections }
          })
          set((state) => ({
            selection: state.selection.filter((id) => !idSet.has(id)),
            editingId:
              state.editingId && objectIds.has(state.editingId) ? null : state.editingId,
          }))
        },

        deleteSelection: () => {
          const selection = get().selection
          if (selection.length) get().deleteIds(selection)
        },

        /* ----------------------- commands ----------------------- */

        duplicateSelection: () => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const selectedIds = new Set(state.selection)
          const originals = canvas.objects.filter((object) => selectedIds.has(object.id))
          if (!originals.length) return
          const idMap = new Map<string, string>()
          const clones = originals.map((object) => {
            const clone = duplicateObject(object)
            idMap.set(object.id, clone.id)
            return clone
          })
          const connections: Connection[] = []
          for (const connection of canvas.connections) {
            const from = idMap.get(connection.from.objectId)
            const to = idMap.get(connection.to.objectId)
            if (!from || !to) continue
            connections.push({
              ...copyConnection(connection),
              id: uid(),
              from: { ...connection.from, objectId: from },
              to: { ...connection.to, objectId: to },
            })
          }
          recordHistory()
          mutateActive((current) => ({
            ...current,
            objects: [...current.objects, ...clones],
            connections: [...current.connections, ...connections],
          }))
          set({ selection: clones.map((clone) => clone.id) })
        },

        copySelection: () => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const selectedIds = new Set(state.selection)
          const objects = canvas.objects
            .filter((object) => selectedIds.has(object.id))
            .map(copyObjectData)
          if (!objects.length) return
          const objectIds = new Set(objects.map((object) => object.id))
          clipboard = {
            objects,
            connections: canvas.connections
              .filter(
                (connection) =>
                  objectIds.has(connection.from.objectId) &&
                  objectIds.has(connection.to.objectId),
              )
              .map(copyConnection),
          }
        },

        paste: () => {
          if (!clipboard) return
          const objectIdMap = new Map<string, string>()
          const groupIdMap = new Map<string, string>()
          const objects = clipboard.objects.map((object) => {
            const clone = duplicateObject(object, 28)
            objectIdMap.set(object.id, clone.id)
            if (object.groupId && !groupIdMap.has(object.groupId)) {
              groupIdMap.set(object.groupId, uid())
            }
            return { ...clone, groupId: object.groupId ? (groupIdMap.get(object.groupId) ?? null) : null }
          })
          const connections: Connection[] = []
          for (const connection of clipboard.connections) {
            const from = objectIdMap.get(connection.from.objectId)
            const to = objectIdMap.get(connection.to.objectId)
            if (!from || !to) continue
            connections.push({
              ...copyConnection(connection),
              id: uid(),
              from: { ...connection.from, objectId: from },
              to: { ...connection.to, objectId: to },
            })
          }
          recordHistory()
          mutateActive((canvas) => ({
            ...canvas,
            objects: [...canvas.objects, ...objects],
            connections: [...canvas.connections, ...connections],
          }))
          set({ selection: objects.map((object) => object.id) })
        },

        align: (mode, viewRect) => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const selectedIds = new Set(state.selection)
          const selected = canvas.objects.filter((object) => selectedIds.has(object.id))
          if (!selected.length) return
          const target = selected.length > 1 ? objectsBounds(selected) : viewRect
          if (!target) return
          const updates: ObjectUpdate[] = []
          for (const object of selected) {
            const bounds = objectBounds(object)
            let dx = 0
            let dy = 0
            switch (mode) {
              case 'left':
                dx = target.x - bounds.x
                break
              case 'center':
                dx = target.x + target.width / 2 - (bounds.x + bounds.width / 2)
                break
              case 'right':
                dx = target.x + target.width - (bounds.x + bounds.width)
                break
              case 'top':
                dy = target.y - bounds.y
                break
              case 'middle':
                dy = target.y + target.height / 2 - (bounds.y + bounds.height / 2)
                break
              case 'bottom':
                dy = target.y + target.height - (bounds.y + bounds.height)
                break
            }
            updates.push({
              id: object.id,
              patch: {
                x: Math.round(object.x + dx),
                y: Math.round(object.y + dy),
              },
            })
          }
          get().updateObjects(updates, { history: true, key: `align:${mode}` })
        },

        zOrder: (mode) => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const selectedIds = new Set(state.selection)
          const selected = canvas.objects.filter((object) => selectedIds.has(object.id))
          if (!selected.length) return
          const rest = canvas.objects.filter((object) => !selectedIds.has(object.id))
          const objects = mode === 'front' ? [...rest, ...selected] : [...selected, ...rest]
          recordHistory(`z:${mode}`)
          mutateActive((current) => ({ ...current, objects }))
        },

        groupSelection: () => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const selectedIds = new Set(state.selection)
          const selected = canvas.objects.filter((object) => selectedIds.has(object.id))
          if (selected.length < 2) return
          const groupId = uid()
          recordHistory()
          mutateActive((current) => ({
            ...current,
            objects: current.objects.map((object) =>
              selectedIds.has(object.id) ? { ...object, groupId } : object,
            ),
          }))
        },

        ungroupSelection: () => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const selectedIds = new Set(state.selection)
          const hasGrouped = canvas.objects.some(
            (object) => selectedIds.has(object.id) && object.groupId,
          )
          if (!hasGrouped) return
          recordHistory()
          mutateActive((current) => ({
            ...current,
            objects: current.objects.map((object) =>
              selectedIds.has(object.id) && object.groupId
                ? { ...object, groupId: null }
                : object,
            ),
          }))
        },

        /* ----------------------- history ------------------------ */

        undo: () => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const history: CanvasHistory = state.history[state.activeCanvasId] ?? {
            past: [],
            future: [],
          }
          const previous = history.past[history.past.length - 1]
          if (!previous) return
          applyHistory({
            past: history.past.slice(0, -1),
            future: [...history.future, snapshot(canvas)].slice(-HISTORY_LIMIT),
          })
          mutateActive((current) => ({
            ...current,
            objects: previous.objects.map(copyObjectData),
            connections: previous.connections.map(copyConnection),
          }))
          set({ selection: [], editingId: null })
        },

        redo: () => {
          const state = get()
          const canvas = findActive()
          if (!canvas) return
          const history: CanvasHistory = state.history[state.activeCanvasId] ?? {
            past: [],
            future: [],
          }
          const next = history.future[history.future.length - 1]
          if (!next) return
          applyHistory({
            past: [...history.past, snapshot(canvas)].slice(-HISTORY_LIMIT),
            future: history.future.slice(0, -1),
          })
          mutateActive((current) => ({
            ...current,
            objects: next.objects.map(copyObjectData),
            connections: next.connections.map(copyConnection),
          }))
          set({ selection: [], editingId: null })
        },
      }
    },
    {
      name: 'nexus:canvas:v1',
      version: 2,
      storage: createJSONStorage(() => canvasStorage),
      partialize: (state) =>
        // Never persist a dangling active id and always write the id-keyed form.
        toPersistedCanvasState(state.canvases, state.activeCanvasId),
      migrate: migratePersisted,
      merge: mergePersisted,
    },
  ),
)

/* ------------------------------------------------------------------ */
/*  Selectors / helpers for components                                 */
/* ------------------------------------------------------------------ */

export const useActiveCanvas = (): CanvasDoc | null =>
  useCanvasStore(
    (state) =>
      state.canvases.find((canvas) => canvas.id === state.activeCanvasId) ??
      state.canvases[0] ??
      null,
  )

/**
 * Repairs a dangling `activeCanvasId` in memory (and therefore in the persisted
 * payload). Returns the effective active canvas id.
 */
export function ensureActiveCanvas(): string {
  const state = useCanvasStore.getState()
  if (state.canvases.some((canvas) => canvas.id === state.activeCanvasId)) {
    return state.activeCanvasId
  }
  const fallback = state.canvases[0]?.id ?? ''
  useCanvasStore.setState({ activeCanvasId: fallback })
  return fallback
}

/*
 * One-time repair write after rehydration: the persisted JSON is always
 * rewritten in the current shape (array of valid canvases + existing active
 * id), so legacy or corrupted payloads cannot be carried forward forever.
 */
if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    const state = useCanvasStore.getState()
    const canvases = normalizeCanvases(state.canvases)
    const activeCanvasId = canvases.some(
      (canvas) => canvas.id === state.activeCanvasId,
    )
      ? state.activeCanvasId
      : (canvases[0]?.id ?? '')
    useCanvasStore.setState({ canvases, activeCanvasId })
  }, 0)
}

export const selectCanUndo = (state: CanvasStoreState): boolean =>
  (state.history[state.activeCanvasId]?.past.length ?? 0) > 0

export const selectCanRedo = (state: CanvasStoreState): boolean =>
  (state.history[state.activeCanvasId]?.future.length ?? 0) > 0

export function defaultCanvasName(index: number): string {
  return `Canvas ${index + 1}`
}
