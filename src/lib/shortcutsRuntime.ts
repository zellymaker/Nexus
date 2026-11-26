/**
 * Global keyboard runtime. Listens once (capture phase, so it can stop WebKit
 * defaults like Ctrl+W / Ctrl+Tab), resolves the user's bindings and dispatches
 * the matching action with context guards:
 *
 *  - text inputs / contentEditable only receive actions marked `allowInInput`;
 *  - canvas-scoped shortcuts are left to the canvas module;
 *  - when a modal/palette/context menu is open, navigation keys are reserved.
 */
import { useEffect } from 'react'
import {
  SHORTCUT_DEFS,
  eventToBinding,
  isEditableTarget,
  matchesBinding,
} from './shortcuts'
import type { ShortcutDef } from './shortcuts'
import { flushPersistence, useStore } from './store'

const isTyping = () => isEditableTarget(document.activeElement)

/**
 * Shortcuts owned by the canvas module while the canvas view is active.
 * The canvas listens on its own (capture) and must receive these keys without
 * the workspace runtime stealing them.
 */
const CANVAS_OWNED = new Set([
  'undo',
  'redo',
  'duplicate-selection',
  'delete-selection',
  'rename-selection',
  'save-document',
  'close-modal',
])

export function useGlobalShortcuts() {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const state = useStore.getState()
      const bindings = state.settings.shortcuts
      const binding = eventToBinding(event)

      const find = (id: string) => {
        const def = SHORTCUT_DEFS.find((d) => d.id === id)
        if (!def) return false
        const custom = bindings[id]
        const effective = custom !== undefined ? custom : def.defaultBinding
        return matchesBinding(effective, event)
      }

      const run = (
        id: string,
        action: (def: ShortcutDef) => void,
        options: { allowInInput?: boolean } = {},
      ) => {
        const def = SHORTCUT_DEFS.find((d) => d.id === id)
        if (!def) return false
        if (def.group === 'canvas') return false
        if (state.paletteOpen && id !== 'palette' && id !== 'close-modal') return false
        const allow = options.allowInInput ?? def.allowInInput ?? false
        if (isTyping() && !allow) return false
        const modalLayerOpen = state.paletteOpen || !!state.deleteDialog || !!state.editingNodeId
        if (state.view.kind === 'canvas' && !modalLayerOpen && CANVAS_OWNED.has(def.id)) {
          return false
        }
        if (!find(id)) return false
        event.preventDefault()
        event.stopPropagation()
        action(def)
        return true
      }

      // --- Escape: close the top-most layer first -------------------
      if (find('close-modal')) {
        const handled =
          run('close-modal', () => {
            if (state.paletteOpen) state.setPaletteOpen(false)
            else if (state.deleteDialog) state.cancelDelete()
            else if (state.editingNodeId) state.cancelRename()
            else if (state.searchQuery) state.setSearchQuery('')
            else state.clearSelection()
          }) ||
          // Escape is allowed inside inputs, but must not swallow native Esc
          false
        if (handled) return
        // If Escape arrives while typing and nothing is open we let WebKit handle it.
      }

      // --- command palette / search ---------------------------------
      if (run('palette', () => state.setPaletteOpen(!state.paletteOpen), { allowInInput: true }))
        return
      if (
        run('quick-search', () => {
          state.setRightOpen(true)
          window.dispatchEvent(new CustomEvent('nexus:focus-search'))
        })
      )
        return

      // --- workspace -------------------------------------------------
      if (
        run('create-note', () => {
          const target = firstSelectedFolder(state.nodes, state.selectedIds)
          const id = state.createNote(target ?? null)
          state.pushToast({
            title: translateTitle('toast.created', state.settings.language, 'Created'),
            tone: 'success',
          })
          void id
        })
      )
        return
      if (
        run('create-folder', () => {
          const target = firstSelectedFolder(state.nodes, state.selectedIds)
          state.createFolder(target ?? null)
        })
      )
        return
      if (
        run('create-canvas', () => {
          window.dispatchEvent(new CustomEvent('nexus:canvas-create'))
          state.setView({ kind: 'canvas' })
          state.setNav('canvas')
        })
      )
        return
      if (
        run(
          'delete-selection',
          () => {
            if (!state.selectedIds.length) return
            state.requestDelete(state.selectedIds)
          },
          { allowInInput: false },
        )
      )
        return
      if (
        run(
          'rename-selection',
          () => {
            const id = state.selectedIds[0]
            if (id) state.startRename(id)
          },
          { allowInInput: false },
        )
      )
        return
      if (
        run(
          'duplicate-selection',
          () => {
            const id = state.selectedIds[0]
            if (!id) return
            const clone = state.duplicateNode(id)
            if (clone) {
              const node = useStore.getState().nodes[clone]
              state.pushToast({ title: `Duplicated “${node?.name ?? ''}”`, tone: 'default' })
            }
          },
          { allowInInput: false },
        )
      )
        return
      if (
        run(
          'save-document',
          () => {
            window.dispatchEvent(new CustomEvent('nexus:save'))
            flushPersistence()
            const lang = useStore.getState().settings.language
            state.pushToast({
              title: translate(lang, 'toast.saved', 'Saved'),
              tone: 'success',
              duration: 1600,
            })
          },
          { allowInInput: true },
        )
      )
        return
      if (
        run(
          'undo',
          () => {
            state.undoDelete()
          },
          { allowInInput: false },
        )
      )
        return
      if (
        run(
          'redo',
          () => {
            state.redoDelete()
          },
          { allowInInput: false },
        )
      )
        return
      if (run('toggle-sidebar', () => state.toggleLeft(), { allowInInput: true })) return

      // --- navigation ------------------------------------------------
      if (run('close-tab', () => state.closeTab(state.activeTabId), { allowInInput: true })) return
      if (run('next-tab', () => state.cycleTab(1), { allowInInput: true })) return
      if (run('prev-tab', () => state.cycleTab(-1), { allowInInput: true })) return
      if (
        run(
          'open-settings',
          () => {
            state.setView({ kind: 'settings', section: 'general' })
            state.setNav('settings')
          },
          { allowInInput: true },
        )
      )
        return
      void binding
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])
}

function firstSelectedFolder(
  nodes: Record<string, { kind: string }>,
  selected: string[],
): string | null {
  for (const id of selected) {
    if (nodes[id]?.kind === 'folder') return id
  }
  return null
}

// tiny inline helper to avoid importing i18n hooks into this module
import { translate } from './messages'
function translateTitle(key: string, lang: 'ru' | 'en', fallback: string) {
  return translate(lang, key, fallback)
}
