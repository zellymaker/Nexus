import { useSyncExternalStore } from 'react'
import { saveStatus } from '../saveStatus'
import type { SaveState } from '../saveStatus'

/** Reactive autosave indicator state for the top bar. */
export function useSaveStatus(): SaveState {
  return useSyncExternalStore(saveStatus.subscribe, saveStatus.get, saveStatus.get)
}
