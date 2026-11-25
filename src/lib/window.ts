type TauriWindow = {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  unmaximize: () => Promise<void>
  isMaximized: () => Promise<boolean>
  close: () => Promise<void>
}

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

async function withWindow(fn: (w: TauriWindow) => Promise<void>) {
  if (!isTauri()) return
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await fn(getCurrentWindow() as unknown as TauriWindow)
  } catch {
    /* running in a plain browser — window controls are cosmetic there */
  }
}

export const minimizeWindow = () => withWindow((w) => w.minimize())

export const toggleMaximizeWindow = () =>
  withWindow(async (w) => {
    if (await w.isMaximized()) await w.unmaximize()
    else await w.maximize()
  })

export const closeWindow = () => withWindow((w) => w.close())
