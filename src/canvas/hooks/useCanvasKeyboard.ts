/**
 * Canvas keyboard handling.
 *
 * Runs in the capture phase on `window` and only while the canvas view is
 * active. The global runtime (`lib/shortcutsRuntime.ts`) leaves canvas-owned
 * shortcuts alone in this mode, so this hook is the single owner of
 * tool / undo / clipboard / Escape keys on the board.
 */
import { useEffect } from 'react'
import { SHORTCUT_DEFS, isEditableTarget, resolveBindings } from '../../lib/shortcuts'
import { useStore } from '../../lib/store'
import { useCanvasStore } from '../store'
import type { Tool } from '../types'
import { bindingMatches } from '../utils/bindings'

export interface CanvasKeyboardHandlers {
  fitToContent: () => void
  resetZoom: () => void
  openSearch: () => void
  openDocumentPicker: () => void
  requestImage: () => void
  /** Close the top-most canvas overlay; returns true when something closed. */
  closeOverlay: () => boolean
  nudge: (dx: number, dy: number) => void
}

const TOOL_SHORTCUTS: Record<string, Tool> = {
  'canvas-select': 'select',
  'canvas-hand': 'hand',
  'canvas-sticky': 'sticky',
  'canvas-text': 'text',
  'canvas-draw': 'draw',
  'canvas-eraser': 'eraser',
}

export function useCanvasKeyboard(enabled: boolean, handlers: CanvasKeyboardHandlers): void {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.isComposing) return
      if (isEditableTarget(event.target) || isEditableTarget(document.activeElement)) return
      const app = useStore.getState()
      if (app.paletteOpen || app.deleteDialog) return
      if (!SHORTCUT_DEFS.length) return

      const store = useCanvasStore.getState()
      if (!store.activeCanvasId) return
      const bindings = resolveBindings(app.settings.shortcuts)
      const match = (id: string) => bindingMatches(bindings[id], event)
      const consume = () => {
        event.preventDefault()
        event.stopPropagation()
      }
      const run = (action: () => void) => {
        consume()
        action()
      }

      for (const [id, tool] of Object.entries(TOOL_SHORTCUTS)) {
        if (match(id)) {
          run(() => store.setTool(tool))
          return
        }
      }
      if (match('canvas-shape')) {
        run(() => useCanvasStore.getState().setTool(useCanvasStore.getState().lastShape))
        return
      }
      if (match('canvas-connector')) {
        run(() => store.setTool('connector'))
        return
      }
      if (match('canvas-image')) {
        run(() => handlers.requestImage())
        return
      }
      if (match('canvas-document')) {
        run(() => handlers.openDocumentPicker())
        return
      }
      if (match('canvas-group')) {
        run(() => store.groupSelection())
        return
      }
      if (match('canvas-ungroup')) {
        run(() => store.ungroupSelection())
        return
      }
      if (match('canvas-search')) {
        run(() => handlers.openSearch())
        return
      }
      if (match('canvas-center')) {
        run(() => handlers.fitToContent())
        return
      }
      if (match('canvas-reset-zoom')) {
        run(() => handlers.resetZoom())
        return
      }
      if (match('canvas-delete')) {
        run(() => useCanvasStore.getState().deleteSelection())
        return
      }
      if (match('undo')) {
        run(() => useCanvasStore.getState().undo())
        return
      }
      if (match('redo')) {
        run(() => useCanvasStore.getState().redo())
        return
      }
      if (match('duplicate-selection')) {
        run(() => useCanvasStore.getState().duplicateSelection())
        return
      }

      const modifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      if (modifier && !event.altKey) {
        if (key === 'c') {
          run(() => useCanvasStore.getState().copySelection())
          return
        }
        if (key === 'v') {
          run(() => useCanvasStore.getState().paste())
          return
        }
        if (key === 'a') {
          run(() => useCanvasStore.getState().selectAll())
          return
        }
        if (key === 'x') {
          run(() => {
            const current = useCanvasStore.getState()
            current.copySelection()
            current.deleteSelection()
          })
          return
        }
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        run(() => useCanvasStore.getState().deleteSelection())
        return
      }
      if (event.key === 'Escape') {
        if (handlers.closeOverlay()) {
          consume()
          return
        }
        const current = useCanvasStore.getState()
        if (current.editingId) {
          run(() => current.setEditing(null))
          return
        }
        if (current.selection.length) {
          run(() => current.clearSelection())
          return
        }
        if (current.tool !== 'select') {
          run(() => current.setTool('select'))
          return
        }
        return
      }
      if (!modifier && event.key.startsWith('Arrow') && store.selection.length) {
        const step = event.shiftKey ? 10 : 1
        const dx =
          event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        run(() => handlers.nudge(dx, dy))
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [enabled, handlers])
}
