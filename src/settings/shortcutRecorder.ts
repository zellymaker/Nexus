/**
 * Global keydown guard used while the user records a new shortcut.
 *
 * This listener is registered at module evaluation time — before the App
 * mounts and `useGlobalShortcuts()` installs its own window listener — so
 * calling `stopImmediatePropagation()` here prevents the global shortcut
 * runtime from executing commands while a combination is being recorded.
 *
 * `SettingsView` imports the shortcuts section statically, therefore this
 * module is always evaluated as part of the initial bundle.
 */

type RecordingHandler = (event: KeyboardEvent) => void

let handler: RecordingHandler | null = null

export function setRecordingHandler(next: RecordingHandler | null) {
  handler = next
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (event) => {
      if (!handler) return
      event.preventDefault()
      event.stopImmediatePropagation()
      handler(event)
    },
    true,
  )
}
