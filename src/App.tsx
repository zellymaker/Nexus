import { useEffect } from 'react'
import { CommandPalette } from './components/CommandPalette'
import { DeleteDialog } from './components/DeleteDialog'
import { LeftSidebar } from './components/LeftSidebar'
import { MainPane } from './components/MainPane'
import { RightSidebar } from './components/RightSidebar'
import { TitleBar } from './components/TitleBar'
import { ToastHost } from './components/ui/ToastHost'
import { useStore } from './lib/store'
import { useGlobalShortcuts } from './lib/shortcutsRuntime'
import { applySettings, watchSystemPreferences } from './lib/theme'

export default function App() {
  const leftOpen = useStore((s) => s.leftOpen)
  const rightOpen = useStore((s) => s.rightOpen)
  const settings = useStore((s) => s.settings)

  useGlobalShortcuts()

  /* theme, typography, scale, density, motion */
  useEffect(() => {
    applySettings(settings)
  }, [settings])

  useEffect(
    () => watchSystemPreferences(() => applySettings(useStore.getState().settings)),
    [],
  )

  /* startup behaviour + stale-reference guards */
  useEffect(() => {
    const state = useStore.getState()
    if (!state.nodes[state.activeTabId]) {
      const fallback = state.tabs.find((id) => state.nodes[id])
      if (fallback) {
        state.setActiveTab(fallback)
      } else {
        state.setView({ kind: 'list', title: 'All Notes', filter: 'all' })
        state.setNav('all')
      }
    }
    if (state.settings.workspace.startup === 'home') {
      state.setView({ kind: 'list', title: 'All Notes', filter: 'all' })
      state.setNav('all')
    }
  }, [])

  /* security: the webview must never navigate to external pages */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (!/^https?:/i.test(href)) return
      event.preventDefault()
      useStore.getState().pushToast({
        title: 'External links are disabled in NEXUS',
        message: href,
        tone: 'default',
        duration: 3400,
      })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  /* privacy: diagnostics stay in memory and only if the user enabled them */
  useEffect(() => {
    if (!settings.privacy.diagnostics) return
    const withPaths = settings.privacy.diagnosticsPaths
    const onError = (event: ErrorEvent) => {
      const message = withPaths
        ? `${event.message} (${event.filename}:${event.lineno})`
        : event.message
      useStore.getState().recordDiagnostic(message)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason)
      useStore.getState().recordDiagnostic(reason)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [settings.privacy.diagnostics, settings.privacy.diagnosticsPaths])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-app text-ink">
      <TitleBar />

      <div className="flex min-h-0 flex-1">
        <div
          data-sidebar="left"
          className="shrink-0 overflow-hidden border-r border-line transition-[width] duration-200"
          style={{ width: leftOpen ? 244 : 0 }}
          aria-hidden={!leftOpen}
        >
          <div className="h-full w-[244px]">
            <LeftSidebar />
          </div>
        </div>

        <MainPane />

        <div
          data-sidebar="right"
          className="shrink-0 overflow-hidden transition-[width] duration-200"
          style={{ width: rightOpen ? 280 : 0 }}
          aria-hidden={!rightOpen}
        >
          <div className="h-full w-[280px]">
            <RightSidebar />
          </div>
        </div>
      </div>

      <CommandPalette />
      <DeleteDialog />
      <ToastHost />
    </div>
  )
}
