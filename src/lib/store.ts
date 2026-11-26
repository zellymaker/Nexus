/**
 * Single source of truth for the NEXUS workspace.
 *
 * Persisted (localStorage `nexus:store:v1`): workspace tree, note contents,
 * tabs, panel layout, settings, diagnostics preference.
 * Ephemeral: selection, context menus, toasts, undo stacks.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { NOTES } from './data'
import type { TabIcon } from './data'
import { DEFAULT_SETTINGS, THEMES, clamp, type Language, type Settings } from './settings'
import { SHORTCUT_DEFS, normalizeBinding, resolveBindings } from './shortcuts'
import { translate } from './messages'

export type NavId =
  | 'home'
  | 'all'
  | 'favorites'
  | 'recent'
  | 'canvas'
  | 'daily'
  | 'settings'

export type SettingsSection =
  | 'general'
  | 'appearance'
  | 'typography'
  | 'editor'
  | 'workspace'
  | 'privacy'
  | 'shortcuts'
  | 'about'

export type ViewState =
  | { kind: 'note' }
  | {
      kind: 'list'
      title: string
      filter: 'all' | 'favorites' | 'recent' | 'folder'
      folderId?: string
    }
  | { kind: 'canvas' }
  | { kind: 'settings'; section: SettingsSection }

export type NodeKind = 'folder' | 'note'

export interface NodeMeta {
  tags: string[]
  status: string
  priority: string
}

export interface WsNode {
  id: string
  kind: NodeKind
  name: string
  parentId: string | null
  childIds: string[]
  createdAt: number
  updatedAt: number
  icon?: TabIcon
  content?: string
  meta?: NodeMeta
}

export interface Toast {
  id: string
  title: string
  message?: string
  tone: 'default' | 'success' | 'danger'
  actionLabel?: string
  onAction?: () => void
  duration: number
}

interface Snapshot {
  nodes: Record<string, WsNode>
  rootIds: string[]
  tabs: string[]
  activeTabId: string
  favorites: string[]
}

export interface DeleteDialog {
  ids: string[]
  mode: 'cascade' | 'hoist'
}

interface DiagnosticEntry {
  id: string
  at: number
  message: string
}

export interface StoreState {
  /* workspace -------------------------------------------------- */
  nodes: Record<string, WsNode>
  rootIds: string[]
  favorites: string[]
  expanded: Record<string, boolean>
  selectedIds: string[]
  editingNodeId: string | null

  /* documents -------------------------------------------------- */
  tabs: string[]
  activeTabId: string
  view: ViewState
  activeNav: NavId
  searchQuery: string

  /* ui --------------------------------------------------------- */
  leftOpen: boolean
  rightOpen: boolean
  paletteOpen: boolean
  paletteQuery: string

  /* settings & feedback ---------------------------------------- */
  settings: Settings
  toasts: Toast[]
  deleteDialog: DeleteDialog | null
  undoStack: Snapshot[]
  redoStack: Snapshot[]
  diagnostics: DiagnosticEntry[]

  /* actions: workspace ----------------------------------------- */
  createNote: (parentId?: string | null, name?: string) => string
  createFolder: (parentId?: string | null, name?: string) => string
  renameNode: (id: string, name: string) => void
  duplicateNode: (id: string) => string | null
  moveNode: (id: string, parentId: string | null) => void
  toggleFavorite: (id: string) => void
  requestDelete: (ids?: string[], mode?: 'cascade' | 'hoist') => void
  cancelDelete: () => void
  confirmDelete: (mode?: 'cascade' | 'hoist') => void
  undoDelete: () => void
  redoDelete: () => void

  /* actions: tree/ui ------------------------------------------- */
  toggleFolder: (id: string) => void
  setExpanded: (id: string, value: boolean) => void
  select: (ids: string[]) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
  startRename: (id: string) => void
  cancelRename: () => void
  commitRename: (name: string) => void

  /* actions: documents ----------------------------------------- */
  openNote: (id: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  cycleTab: (dir: 1 | -1) => void
  updateNoteContent: (id: string, content: string) => void
  updateNoteMeta: (id: string, patch: Partial<NodeMeta>) => void
  setView: (view: ViewState) => void
  setNav: (nav: NavId) => void
  setSearchQuery: (q: string) => void

  /* actions: chrome -------------------------------------------- */
  setLeftOpen: (v: boolean) => void
  setRightOpen: (v: boolean) => void
  toggleLeft: () => void
  toggleRight: () => void
  setPaletteOpen: (v: boolean) => void
  setPaletteQuery: (q: string) => void

  /* actions: settings ------------------------------------------ */
  updateSettings: (patch: DeepPartial<Settings>) => void
  resetSettings: () => void
  setShortcut: (id: string, binding: string) => void
  resetShortcuts: () => void
  setLanguage: (lang: Language) => void
  setDiagnostics: (on: boolean) => void
  recordDiagnostic: (message: string) => void
  clearDiagnostics: () => void

  /* actions: toasts -------------------------------------------- */
  pushToast: (
    toast: Omit<Toast, 'id' | 'duration'> & { duration?: number },
  ) => string
  dismissToast: (id: string) => void
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/* ------------------------------------------------------------------ */
/*  Ids / seeds                                                        */
/* ------------------------------------------------------------------ */

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

function seedNodes(): { nodes: Record<string, WsNode>; rootIds: string[] } {
  const now = Date.now()
  const nodes: Record<string, WsNode> = {}
  const byId = Object.fromEntries(NOTES.map((n) => [n.id, n]))
  const DAY_MS = 86_400_000

  const folder = (id: string, name: string, parentId: string | null): void => {
    nodes[id] = {
      id,
      kind: 'folder',
      name,
      parentId,
      childIds: [],
      createdAt: now - 12 * DAY_MS,
      updatedAt: now - 12 * DAY_MS,
    }
  }

  const note = (
    id: string,
    name: string,
    parentId: string | null,
    source: string,
  ): void => {
    const sourceNote = byId[source]
    nodes[id] = {
      id,
      kind: 'note',
      name,
      parentId,
      childIds: [],
      createdAt: now - 9 * DAY_MS,
      updatedAt: now - 5 * 60_000,
      icon: sourceNote?.icon ?? 'plain',
      content: sourceNote?.content ?? '<p class="ed-p"></p>',
      meta: {
        tags: sourceNote?.meta.tags ?? [],
        status: sourceNote?.meta.status ?? 'Draft',
        priority: sourceNote?.meta.priority ?? 'Low',
      },
    }
  }

  // Folder structure mirrors the reference workspace explorer.
  folder('projects', 'Projects', null)
  folder('resources', 'Resources', null)
  folder('archive', 'Archive', null)
  folder('products', 'Products', null)
  folder('archive-expanded', 'Archive', null)

  note('second-brain', 'Building a Second Brain', 'projects', 'second-brain')
  note('projects-overview', 'Projects Overview', 'projects', 'projects-overview')
  note('productivity-system', 'Productivity System', 'resources', 'productivity-system')
  note('documents', 'Documents', 'archive-expanded', 'documents')
  note('documents-b', 'Documents', 'archive-expanded', 'documents')

  // Notes that live outside the tree: reachable from tabs / Daily Notes / search.
  // They appear in the explorer only when "show hidden" is enabled.
  note('team-sync', 'Team Sync', null, 'team-sync')
  note('daily-notes', 'Daily Notes', null, 'daily-notes')

  nodes['projects'].childIds = ['second-brain', 'projects-overview']
  nodes['resources'].childIds = ['productivity-system']
  nodes['archive-expanded'].childIds = ['documents', 'documents-b']

  return { nodes, rootIds: ['projects', 'resources', 'archive', 'products', 'archive-expanded'] }
}

const seed = seedNodes()

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export const childIdsOf = (nodes: Record<string, WsNode>, parentId: string | null) =>
  parentId === null ? [] : (nodes[parentId]?.childIds ?? [])

export const getNode = (
  nodes: Record<string, WsNode>,
  id: string | null | undefined,
): WsNode | undefined => (id ? nodes[id] : undefined)

export function collectDescendants(
  nodes: Record<string, WsNode>,
  id: string,
  acc: string[] = [],
): string[] {
  const node = nodes[id]
  if (!node) return acc
  for (const childId of node.childIds) {
    acc.push(childId)
    collectDescendants(nodes, childId, acc)
  }
  return acc
}

export function nodePath(
  nodes: Record<string, WsNode>,
  id: string,
): WsNode[] {
  const path: WsNode[] = []
  let current: WsNode | undefined = nodes[id]
  let guard = 0
  while (current && guard++ < 64) {
    path.unshift(current)
    current = current.parentId ? nodes[current.parentId] : undefined
  }
  return path
}

export function isDescendantOf(
  nodes: Record<string, WsNode>,
  childId: string,
  ancestorId: string,
): boolean {
  let current: WsNode | undefined = nodes[childId]
  let guard = 0
  while (current?.parentId && guard++ < 64) {
    if (current.parentId === ancestorId) return true
    current = nodes[current.parentId]
  }
  return false
}

export const countWords = (html: string): number => {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.split(' ').length : 0
}

const compareNames = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export function sortNodeIds(
  nodes: Record<string, WsNode>,
  ids: string[],
  sortFiles: Settings['workspace']['sortFiles'],
  sortFolders: Settings['workspace']['sortFolders'],
): string[] {
  const rank = (n: WsNode) => (n.kind === 'folder' ? 0 : 1)
  return [...ids].sort((a, b) => {
    const na = nodes[a]
    const nb = nodes[b]
    if (!na || !nb) return 0
    const rankDiff = rank(na) - rank(nb)
    if (rankDiff !== 0) return rankDiff
    const mode = na.kind === 'folder' ? sortFolders : sortFiles
    if (mode === 'manual') {
      const order = na.parentId
        ? (nodes[na.parentId]?.childIds ?? [])
        : []
      const ai = order.indexOf(a)
      const bi = order.indexOf(b)
      return (ai === -1 ? 1e9 : ai) - (bi === -1 ? 1e9 : bi)
    }
    if (mode === 'name') return compareNames.compare(na.name, nb.name)
    if (mode === 'created') return nb.createdAt - na.createdAt
    return nb.updatedAt - na.updatedAt
  })
}

export interface FlatTreeItem {
  node: WsNode
  depth: number
}

/** Depth-first list of visible nodes (respecting expanded folders). */
export function flattenTree(
  nodes: Record<string, WsNode>,
  rootIds: string[],
  expanded: Record<string, boolean>,
  sortFiles: Settings['workspace']['sortFiles'] = 'name',
  sortFolders: Settings['workspace']['sortFolders'] = 'name',
): FlatTreeItem[] {
  const result: FlatTreeItem[] = []
  const walk = (ids: string[], depth: number) => {
    for (const id of sortNodeIds(nodes, ids, sortFiles, sortFolders)) {
      const node = nodes[id]
      if (!node) continue
      result.push({ node, depth })
      if (node.kind === 'folder' && expanded[id] && node.childIds.length) {
        walk(node.childIds, depth + 1)
      }
    }
  }
  walk(rootIds, 0)
  return result
}

/** Notes that link to `id` (via data-note attributes or [[Name]] text). */
export function getBacklinks(nodes: Record<string, WsNode>, id: string): string[] {
  const target = nodes[id]
  if (!target) return []
  const targetName = target.name.toLowerCase()
  const result: string[] = []
  for (const node of Object.values(nodes)) {
    if (node.kind !== 'note' || node.id === id || !node.content) continue
    const content = node.content
    const byAttr = content.includes(`data-note="${id}"`)
    const byTitle =
      content.toLowerCase().includes(`[[${targetName}]]`) ||
      content.includes(target.name)
    if (byAttr || byTitle) result.push(node.id)
  }
  return result
}

/** Notes sharing tags with `id` (or mutually linked). */
export function getRelated(nodes: Record<string, WsNode>, id: string): string[] {
  const target = nodes[id]
  if (!target) return []
  const tags = new Set(target.meta?.tags ?? [])
  const scored: { id: string; score: number }[] = []
  for (const node of Object.values(nodes)) {
    if (node.kind !== 'note' || node.id === id) continue
    let score = 0
    for (const tag of node.meta?.tags ?? []) if (tags.has(tag)) score += 2
    if (node.content?.includes(`data-note="${id}"`)) score += 3
    if (target.content?.includes(`data-note="${node.id}"`)) score += 3
    if (score > 0) scored.push({ id: node.id, score })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => s.id)
}

export const noteTitle = (node: WsNode | undefined, fallback = 'Untitled') =>
  node?.name?.trim() || fallback

/* ------------------------------------------------------------------ */
/*  Debounced storage                                                  */
/* ------------------------------------------------------------------ */

const pending = new Map<string, string>()
let flushTimer: number | undefined

function flushStorage() {
  if (flushTimer) {
    window.clearTimeout(flushTimer)
    flushTimer = undefined
  }
  for (const [key, value] of pending) {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      // quota exceeded / private mode: keep the in-memory state usable and
      // make the failure visible instead of losing data silently
      console.error('[nexus] unable to persist state', error)
    }
  }
  pending.clear()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushStorage)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushStorage()
  })
}

const debouncedStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    pending.set(name, value)
    if (flushTimer) window.clearTimeout(flushTimer)
    flushTimer = window.setTimeout(flushStorage, 250)
  },
  removeItem: (name) => {
    pending.delete(name)
    localStorage.removeItem(name)
  },
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

const initialSettings: Settings = {
  ...DEFAULT_SETTINGS,
  shortcuts: {},
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...seed,
      favorites: ['second-brain', 'productivity-system'],
      expanded: { 'archive-expanded': true },
      selectedIds: [],
      editingNodeId: null,

      tabs: ['second-brain', 'projects-overview', 'team-sync'],
      activeTabId: 'second-brain',
      view: { kind: 'note' },
      activeNav: 'home',
      searchQuery: '',

      leftOpen: true,
      rightOpen: true,
      paletteOpen: false,
      paletteQuery: '',

      settings: initialSettings,
      toasts: [],
      deleteDialog: null,
      undoStack: [],
      redoStack: [],
      diagnostics: [],

      /* ----------------------- workspace ----------------------- */

      createNote: (parentId = null, name) => {
        const id = uid()
        const now = Date.now()
        const finalName = name ?? 'Untitled Note'
        set((state) => {
          const nodes = { ...state.nodes }
          const node: WsNode = {
            id,
            kind: 'note',
            name: finalName,
            parentId,
            childIds: [],
            createdAt: now,
            updatedAt: now,
            icon: 'plain',
            content: `<h2 class="ed-h1"><span class="md-mark">## </span>${finalName}</h2><p class="ed-p">Start writing…</p>`,
            meta: { tags: ['#draft'], status: 'Draft', priority: 'Low' },
          }
          nodes[id] = node
          let rootIds = state.rootIds
          const nextNodes = { ...nodes }
          if (parentId) {
            const parent = nextNodes[parentId]
            if (parent) nextNodes[parentId] = { ...parent, childIds: [...parent.childIds, id], updatedAt: now }
            if (!state.expanded[parentId]) {
              /* keep current collapse state; the caller may expand */
            }
          } else {
            rootIds = [...state.rootIds, id]
          }
          const expanded = parentId
            ? { ...state.expanded, [parentId]: true }
            : state.expanded
          return {
            nodes: nextNodes,
            rootIds,
            expanded,
            tabs: [...state.tabs, id],
            activeTabId: id,
            view: { kind: 'note' },
            activeNav: 'home',
            selectedIds: [id],
          }
        })
        get().pushToast({
          title: translate(get().settings.language, 'toast.created', 'Created: {name}').replace(
            '{name}',
            finalName,
          ),
          tone: 'success',
          duration: 2200,
        })
        return id
      },

      createFolder: (parentId = null, name) => {
        const id = uid()
        const now = Date.now()
        set((state) => {
          const nodes = { ...state.nodes }
          nodes[id] = {
            id,
            kind: 'folder',
            name: name ?? 'New Folder',
            parentId,
            childIds: [],
            createdAt: now,
            updatedAt: now,
          }
          let rootIds = state.rootIds
          if (parentId && nodes[parentId]) {
            nodes[parentId] = {
              ...nodes[parentId],
              childIds: [...nodes[parentId].childIds, id],
              updatedAt: now,
            }
          } else if (!parentId) {
            rootIds = [...state.rootIds, id]
          }
          return {
            nodes,
            rootIds,
            expanded: parentId
              ? { ...state.expanded, [parentId]: true }
              : state.expanded,
            selectedIds: [id],
            editingNodeId: id,
          }
        })
        get().pushToast({
          title: translate(get().settings.language, 'toast.created', 'Created: {name}').replace(
            '{name}',
            name ?? 'New Folder',
          ),
          tone: 'success',
          duration: 2200,
        })
        return id
      },

      renameNode: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((state) => {
          const node = state.nodes[id]
          if (!node) return state
          return {
            nodes: {
              ...state.nodes,
              [id]: { ...node, name: trimmed, updatedAt: Date.now() },
            },
            editingNodeId: null,
          }
        })
      },

      duplicateNode: (id) => {
        const state = get()
        const source = state.nodes[id]
        if (!source) return null
        let newId: string | null = null
        set((current) => {
          const nodes = { ...current.nodes }
          const now = Date.now()
          const cloneNode = (nodeId: string, parentId: string | null): string => {
            const original = nodes[nodeId]
            const cloneId = uid()
            nodes[cloneId] = {
              ...original,
              id: cloneId,
              parentId,
              name: parentId === null ? `${original.name} copy` : original.name,
              createdAt: now,
              updatedAt: now,
              childIds: [],
            }
            if (original.kind === 'folder') {
              nodes[cloneId].childIds = original.childIds.map((childId) =>
                cloneNode(childId, cloneId),
              )
            }
            return cloneId
          }
          const parentId = source.parentId
          const cloneId = cloneNode(id, parentId)
          newId = cloneId
          if (parentId && nodes[parentId]) {
            // cloneNode already used parentId; ensure it appears after sibling
            const parent = nodes[parentId]
            const idx = parent.childIds.indexOf(id)
            const childIds = [...parent.childIds]
            childIds.splice(idx + 1, 0, cloneId)
            nodes[parentId] = { ...parent, childIds, updatedAt: now }
          }
          const rootIds = parentId ? current.rootIds : [...current.rootIds, cloneId]
          return { nodes, rootIds, selectedIds: [cloneId], editingNodeId: cloneId }
        })
        return newId
      },

      moveNode: (id, parentId) => {
        if (id === parentId) return
        set((state) => {
          if (parentId && isDescendantOf(state.nodes, parentId, id)) return state
          const node = state.nodes[id]
          if (!node || node.parentId === parentId) return state
          const nodes = { ...state.nodes }
          nodes[id] = { ...node, parentId, updatedAt: Date.now() }
          const oldParentId = node.parentId
          if (oldParentId && nodes[oldParentId]) {
            nodes[oldParentId] = {
              ...nodes[oldParentId],
              childIds: nodes[oldParentId].childIds.filter((c) => c !== id),
            }
          }
          let rootIds = state.rootIds.filter((r) => r !== id)
          if (parentId && nodes[parentId]) {
            nodes[parentId] = {
              ...nodes[parentId],
              childIds: [...nodes[parentId].childIds, id],
              updatedAt: Date.now(),
            }
          } else {
            rootIds = [...rootIds, id]
          }
          return { nodes, rootIds, expanded: { ...state.expanded, [parentId ?? '']: true } }
        })
      },

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),

      requestDelete: (ids, mode = 'cascade') => {
        const state = get()
        const targetIds = (ids && ids.length ? ids : state.selectedIds).filter(
          (id) => state.nodes[id],
        )
        if (!targetIds.length) return
        const needsConfirm = state.settings.workspace.confirmDelete
        set({ deleteDialog: { ids: targetIds, mode } })
        if (!needsConfirm) get().confirmDelete()
      },

      cancelDelete: () => set({ deleteDialog: null }),

      confirmDelete: (modeOverride) => {
        const { deleteDialog, nodes, rootIds, tabs, activeTabId, favorites } = get()
        if (!deleteDialog) return
        const ids = deleteDialog.ids
        const mode = modeOverride ?? deleteDialog.mode

        const snapshot: Snapshot = {
          nodes: structuredClone(nodes),
          rootIds: [...rootIds],
          tabs: [...tabs],
          activeTabId,
          favorites: [...favorites],
        }

        const toRemove = new Set<string>()
        const movedChildren: { childId: string; newParentId: string | null }[] = []
        for (const id of ids) {
          const node = nodes[id]
          if (!node) continue
          if (node.kind === 'folder' && mode === 'hoist') {
            for (const childId of node.childIds) {
              movedChildren.push({ childId, newParentId: node.parentId })
            }
          } else if (node.kind === 'folder') {
            toRemove.add(id)
            for (const childId of collectDescendants(nodes, id)) toRemove.add(childId)
          } else {
            toRemove.add(id)
          }
        }

        const nextNodes: Record<string, WsNode> = {}
        for (const [id, node] of Object.entries(nodes)) {
          if (toRemove.has(id)) continue
          nextNodes[id] = {
            ...node,
            childIds: node.childIds.filter((c) => !toRemove.has(c)),
          }
        }
        for (const move of movedChildren) {
          const child = nextNodes[move.childId]
          if (!child) continue
          nextNodes[move.childId] = { ...child, parentId: move.newParentId }
          if (move.newParentId && nextNodes[move.newParentId]) {
            nextNodes[move.newParentId] = {
              ...nextNodes[move.newParentId],
              childIds: [...nextNodes[move.newParentId].childIds, move.childId],
            }
          }
        }

        const remainingRoots = rootIds.filter((id) => !toRemove.has(id))
        const hoistedRoots = movedChildren
          .filter((m) => m.newParentId === null)
          .map((m) => m.childId)
        const nextRootIds = [...remainingRoots, ...hoistedRoots]

        const remainingTabs = tabs.filter((t) => !toRemove.has(t))
        let nextActive = activeTabId
        if (toRemove.has(activeTabId)) {
          nextActive = remainingTabs[0] ?? ''
        }

        const label =
          ids.length === 1
            ? nodes[ids[0]]?.name ?? 'element'
            : String(ids.length)

        const state = get()
        set({
          nodes: nextNodes,
          rootIds: nextRootIds,
          tabs: remainingTabs,
          activeTabId: nextActive,
          selectedIds: [],
          deleteDialog: null,
          undoStack: [...state.undoStack.slice(-19), snapshot],
          redoStack: [],
        })

        if (toRemove.has(activeTabId) && remainingTabs.length > 0) {
          set({ view: { kind: 'note' }, activeNav: 'home' })
        } else if (toRemove.has(activeTabId)) {
          set({ view: { kind: 'list', title: 'All Notes', filter: 'all' }, activeNav: 'all' })
        }

        const lang = get().settings.language
        state.pushToast({
          title:
            ids.length === 1
              ? translate(lang, 'toast.deletedOne', 'Deleted “{name}”').replace('{name}', label)
              : translate(lang, 'toast.deleted', 'Deleted: {count}').replace('{count}', String(ids.length)),
          tone: 'default',
          actionLabel: translate(lang, 'toast.undo', 'Undo'),
          onAction: () => get().undoDelete(),
        })
      },

      undoDelete: () => {
        const state = get()
        const snapshot = state.undoStack[state.undoStack.length - 1]
        if (!snapshot) return
        set({
          nodes: snapshot.nodes,
          rootIds: snapshot.rootIds,
          tabs: snapshot.tabs,
          activeTabId: snapshot.activeTabId,
          favorites: snapshot.favorites,
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, {
            nodes: structuredClone(state.nodes),
            rootIds: [...state.rootIds],
            tabs: [...state.tabs],
            activeTabId: state.activeTabId,
            favorites: [...state.favorites],
          }],
          view: snapshot.activeTabId ? { kind: 'note' } : state.view,
          activeNav: 'home',
        })
        get().pushToast({
          title: translate(get().settings.language, 'toast.restored', 'Deletion restored'),
          tone: 'default',
        })
      },

      redoDelete: () => {
        const state = get()
        const snapshot = state.redoStack[state.redoStack.length - 1]
        if (!snapshot) return
        set({
          nodes: snapshot.nodes,
          rootIds: snapshot.rootIds,
          tabs: snapshot.tabs,
          activeTabId: snapshot.activeTabId,
          favorites: snapshot.favorites,
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, {
            nodes: structuredClone(state.nodes),
            rootIds: [...state.rootIds],
            tabs: [...state.tabs],
            activeTabId: state.activeTabId,
            favorites: [...state.favorites],
          }],
        })
      },

      /* ----------------------- tree/ui ------------------------- */

      toggleFolder: (id) =>
        set((state) => ({
          expanded: { ...state.expanded, [id]: !state.expanded[id] },
        })),

      setExpanded: (id, value) =>
        set((state) => ({ expanded: { ...state.expanded, [id]: value } })),

      select: (ids) => set({ selectedIds: ids, editingNodeId: null }),

      toggleSelect: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((s) => s !== id)
            : [...state.selectedIds, id],
          editingNodeId: null,
        })),

      clearSelection: () => set({ selectedIds: [], editingNodeId: null }),

      startRename: (id) => set({ editingNodeId: id, selectedIds: [id] }),

      cancelRename: () => set({ editingNodeId: null }),

      commitRename: (name) => {
        const { editingNodeId, renameNode } = get()
        if (editingNodeId) renameNode(editingNodeId, name)
        set({ editingNodeId: null })
      },

      /* ----------------------- documents ----------------------- */

      openNote: (id) => {
        const node = get().nodes[id]
        if (!node || node.kind !== 'note') return
        set((state) => ({
          tabs: state.tabs.includes(id) ? state.tabs : [...state.tabs, id],
          activeTabId: id,
          view: { kind: 'note' },
          activeNav: 'home',
          selectedIds: [id],
          editingNodeId: null,
        }))
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get()
        const nextTabs = tabs.filter((t) => t !== id)
        const nextActive =
          activeTabId === id ? (nextTabs[nextTabs.length - 1] ?? '') : activeTabId
        set({ tabs: nextTabs, activeTabId: nextActive })
        if (!nextTabs.length) {
          set({ view: { kind: 'list', title: 'All Notes', filter: 'all' }, activeNav: 'all' })
        }
      },

      setActiveTab: (id) => set({ activeTabId: id, view: { kind: 'note' }, activeNav: 'home' }),

      cycleTab: (dir) => {
        const { tabs, activeTabId } = get()
        if (tabs.length < 2) return
        const index = tabs.indexOf(activeTabId)
        const next = (index + dir + tabs.length) % tabs.length
        set({ activeTabId: tabs[next], view: { kind: 'note' }, activeNav: 'home' })
      },

      updateNoteContent: (id, content) =>
        set((state) => {
          const node = state.nodes[id]
          if (!node || node.kind !== 'note') return state
          return {
            nodes: {
              ...state.nodes,
              [id]: { ...node, content, updatedAt: Date.now() },
            },
          }
        }),

      updateNoteMeta: (id, patch) =>
        set((state) => {
          const node = state.nodes[id]
          if (!node || node.kind !== 'note') return state
          return {
            nodes: {
              ...state.nodes,
              [id]: {
                ...node,
                meta: {
                  tags: node.meta?.tags ?? [],
                  status: node.meta?.status ?? 'Draft',
                  priority: node.meta?.priority ?? 'Low',
                  ...patch,
                },
                updatedAt: Date.now(),
              },
            },
          }
        }),

      setView: (view) => set({ view }),

      setNav: (nav) => set({ activeNav: nav }),

      setSearchQuery: (q) => set({ searchQuery: q }),

      /* ----------------------- chrome -------------------------- */

      setLeftOpen: (v) => set({ leftOpen: v }),
      setRightOpen: (v) => set({ rightOpen: v }),
      toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
      toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
      setPaletteOpen: (v) => set({ paletteOpen: v }),
      setPaletteQuery: (q) => set({ paletteQuery: q }),

      /* ----------------------- settings ------------------------ */

      updateSettings: (patch) =>
        set((state) => ({
          settings: mergeSettings(state.settings, patch),
        })),

      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS, shortcuts: {} } }),

      setShortcut: (id, binding) =>
        set((state) => {
          const normalized = normalizeBinding(binding)
          const shortcuts = { ...state.settings.shortcuts }
          // clear the same binding from other actions to avoid conflicts
          if (normalized) {
            for (const def of SHORTCUT_DEFS) {
              if (def.id !== id && shortcuts[def.id] && normalizeBinding(shortcuts[def.id]) === normalized) {
                delete shortcuts[def.id]
              }
            }
            shortcuts[id] = normalized
          } else {
            delete shortcuts[id]
          }
          return { settings: { ...state.settings, shortcuts } }
        }),

      resetShortcuts: () =>
        set((state) => ({ settings: { ...state.settings, shortcuts: {} } })),

      setLanguage: (language) =>
        set((state) => ({ settings: { ...state.settings, language } })),

      setDiagnostics: (on) =>
        set((state) => ({
          settings: {
            ...state.settings,
            privacy: { ...state.settings.privacy, diagnostics: on, clearDiagnostics: false },
          },
        })),

      recordDiagnostic: (message) => {
        const state = get()
        if (!state.settings.privacy.diagnostics) return
        set({
          diagnostics: [
            ...state.diagnostics.slice(-99),
            { id: uid(), at: Date.now(), message },
          ],
        })
      },

      clearDiagnostics: () =>
        set((state) => ({
          diagnostics: [],
          settings: {
            ...state.settings,
            privacy: { ...state.settings.privacy, clearDiagnostics: false },
          },
        })),

      /* ----------------------- toasts -------------------------- */

      pushToast: (toast) => {
        const id = uid()
        const state = get()
        if (!state.settings.notifications.toasts) return id
        const item: Toast = {
          id,
          title: toast.title,
          message: toast.message,
          tone: toast.tone,
          actionLabel: toast.actionLabel,
          onAction: toast.onAction,
          duration: toast.duration ?? state.settings.notifications.duration,
        }
        set({ toasts: [...state.toasts.slice(-4), item] })
        if (item.duration > 0) {
          window.setTimeout(() => get().dismissToast(id), item.duration)
        }
        return id
      },

      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'nexus:store:v1',
      version: 1,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        rootIds: state.rootIds,
        favorites: state.favorites,
        expanded: state.expanded,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        view: state.view,
        activeNav: state.activeNav,
        leftOpen: state.leftOpen,
        rightOpen: state.rightOpen,
        settings: state.settings,
      }),
      merge: (persisted, current) => {
        try {
          const data = persisted as Partial<StoreState> | undefined
          if (!data || typeof data !== 'object') return current
          if (!data.nodes || typeof data.nodes !== 'object') return current
          if (!Array.isArray(data.rootIds) || !Array.isArray(data.tabs)) return current
          const nodes = data.nodes as Record<string, WsNode>
          for (const [id, node] of Object.entries(nodes)) {
            if (!node || typeof node !== 'object' || node.id !== id) return current
          }
          return {
            ...current,
            ...data,
            nodes,
            settings: mergeSettings(DEFAULT_SETTINGS, (data.settings ?? {}) as DeepPartial<Settings>),
          }
        } catch {
          return current
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // corrupted storage must not brick the app: fall back to seed state
          console.error('[nexus] failed to restore workspace, using defaults', error)
          try {
            localStorage.removeItem('nexus:store:v1')
          } catch {
            /* ignore */
          }
          return
        }
        if (!state) return
        // theme might have been stored with an unknown id after an upgrade
        const theme = state.settings.theme
        if (theme !== 'system' && !THEMES.some((t) => t.id === theme)) {
          state.updateSettings({ theme: 'nexus-dark' })
        }
        state.updateSettings({ uiScale: clamp(state.settings.uiScale, 0.85, 1.25) })
      },
    },
  ),
)

/* ------------------------------------------------------------------ */
/*  Settings deep merge                                                */
/* ------------------------------------------------------------------ */

function shallowPatch<T extends object>(base: T, patch?: DeepPartial<T>): T {
  if (!patch) return { ...base }
  const out = { ...base }
  for (const key of Object.keys(patch) as Array<keyof T>) {
    const value = patch[key]
    if (value !== undefined) out[key] = value as T[keyof T]
  }
  return out
}

function mergeSettings(base: Settings, patch: DeepPartial<Settings>): Settings {
  const shortcutEntries = Object.entries({
    ...base.shortcuts,
    ...(patch.shortcuts ?? {}),
  }).filter(([, value]) => typeof value === 'string') as [string, string][]
  return {
    ...base,
    ...patch,
    language: patch.language ?? base.language,
    theme: patch.theme ?? base.theme,
    uiScale: patch.uiScale ?? base.uiScale,
    density: patch.density ?? base.density,
    motion: patch.motion ?? base.motion,
    animations: patch.animations ?? base.animations,
    typography: shallowPatch(base.typography, patch.typography),
    editor: shallowPatch(base.editor, patch.editor),
    workspace: shallowPatch(base.workspace, patch.workspace),
    notifications: shallowPatch(base.notifications, patch.notifications),
    privacy: shallowPatch(base.privacy, patch.privacy),
    shortcuts: Object.fromEntries(shortcutEntries),
  }
}

/* ------------------------------------------------------------------ */
/*  Common selectors (avoid re-deriving in components)                 */
/* ------------------------------------------------------------------ */

export function flushPersistence() {
  flushStorage()
}

export function useBindings(): Record<string, string> {
  const shortcuts = useStore((s) => s.settings.shortcuts)
  return resolveBindings(shortcuts)
}
