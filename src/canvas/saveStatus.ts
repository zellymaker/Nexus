/**
 * Tiny external store describing autosave state.
 *
 * The canvas store's debounced localStorage writer calls `markDirty()` /
 * `markSaved()`; the top bar subscribes through `useSaveStatus()` without
 * going through zustand (which would cause a persist feedback loop).
 */

export type SaveState = 'saved' | 'saving'

let state: SaveState = 'saved'
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export const markDirty = (): void => saveStatus.markDirty()

export const markSaved = (): void => saveStatus.markSaved()

export const saveStatus = {
  get: (): SaveState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  markDirty: () => {
    if (state === 'saving') return
    state = 'saving'
    emit()
  },
  markSaved: () => {
    if (state === 'saved') return
    state = 'saved'
    emit()
  },
}
