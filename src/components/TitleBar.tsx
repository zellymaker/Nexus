import { File, PanelLeft, Plus, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useBindings } from '../lib/store'
import { formatBinding, SHORTCUT_DEFS } from '../lib/shortcuts'
import { closeWindow, minimizeWindow, toggleMaximizeWindow } from '../lib/window'
import type { TabIcon } from '../lib/data'

function TabGlyph({ icon, active }: { icon: TabIcon; active: boolean }) {
  if (icon === 'note') {
    return (
      <span className="grid h-[16px] w-[16px] shrink-0 place-items-center rounded-[4.5px] bg-gradient-to-br from-[#b3a8ff] via-[#8d7dff] to-[#6f5fe8] shadow-[0_0_10px_-2px_rgba(141,125,255,0.55)]">
        <svg
          viewBox="0 0 16 16"
          className="h-[10px] w-[10px]"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.7 11.6V4.4l6.6 7.2V4.4" />
        </svg>
      </span>
    )
  }
  if (icon === 'team') {
    return (
      <svg
        viewBox="0 0 16 16"
        className={`h-[16px] w-[16px] shrink-0 ${active ? 'text-accent-bright' : 'text-ink-mute'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.1" y="2.1" width="9.8" height="9.8" rx="2.6" />
        <path d="M7.8 7.8 11.9 11.9M11.9 11.9H9.1M11.9 11.9V9.1" />
      </svg>
    )
  }
  return <File size={16} strokeWidth={1.6} className={active ? 'text-accent-bright' : 'text-ink-mute'} />
}

function TrafficLights() {
  const t = useT()
  const dot =
    'h-[9px] w-[9px] rounded-full bg-[#4b4c54] ring-1 ring-inset ring-white/[0.07] transition-colors'
  return (
    <div className="no-drag flex items-center gap-[6px]">
      <button
        type="button"
        aria-label={t('titlebar.close', 'Close')}
        title={t('titlebar.close', 'Close')}
        onClick={closeWindow}
        className={`${dot} hover:bg-[#e06767]`}
      />
      <button
        type="button"
        aria-label={t('titlebar.minimize', 'Minimize')}
        title={t('titlebar.minimize', 'Minimize')}
        onClick={minimizeWindow}
        className={`${dot} hover:bg-[#d9b25f]`}
      />
      <button
        type="button"
        aria-label={t('titlebar.maximize', 'Maximize')}
        title={t('titlebar.maximize', 'Maximize')}
        onClick={toggleMaximizeWindow}
        className={`${dot} hover:bg-[#6fbf7b]`}
      />
    </div>
  )
}

/** Window chrome: window controls, document tabs, palette hint. */
export function TitleBar() {
  const tabs = useStore((s) => s.tabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const nodes = useStore((s) => s.nodes)
  const leftOpen = useStore((s) => s.leftOpen)
  const rightOpen = useStore((s) => s.rightOpen)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const closeTab = useStore((s) => s.closeTab)
  const createNote = useStore((s) => s.createNote)
  const toggleLeft = useStore((s) => s.toggleLeft)
  const toggleRight = useStore((s) => s.toggleRight)
  const setPaletteOpen = useStore((s) => s.setPaletteOpen)
  const paletteOpen = useStore((s) => s.paletteOpen)
  const bindings = useBindings()
  const t = useT()

  const paletteBinding = formatBinding(
    bindings['palette'] ?? SHORTCUT_DEFS.find((d) => d.id === 'palette')?.defaultBinding,
  )

  return (
    <header
      data-tauri-drag-region
      className="theme-surface flex h-[36px] shrink-0 items-stretch border-b border-line bg-app"
    >
      {/* window controls + panel toggles */}
      <div
        data-tauri-drag-region
        className="flex shrink-0 items-center pl-[14px] pr-[10px] transition-[width] duration-200"
        style={{ width: leftOpen ? 244 : 132 }}
      >
        <TrafficLights />
        <button
          type="button"
          aria-label={t('titlebar.toggleLeft', 'Toggle left sidebar')}
          title={t('titlebar.toggleLeft', 'Toggle left sidebar')}
          onClick={toggleLeft}
          aria-pressed={leftOpen}
          className={`no-drag ml-[28px] grid h-[22px] w-[22px] place-items-center rounded-[5px] transition-colors hover:bg-hover ${
            leftOpen ? 'text-ink-dim' : 'text-ink-faint'
          }`}
        >
          <PanelLeft size={16} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          aria-label={t('titlebar.toggleRight', 'Toggle right sidebar')}
          title={t('titlebar.toggleRight', 'Toggle right sidebar')}
          onClick={toggleRight}
          aria-pressed={rightOpen}
          className={`no-drag ml-auto grid h-[22px] w-[22px] place-items-center rounded-[5px] transition-colors hover:bg-hover ${
            rightOpen ? 'text-ink-dim' : 'text-ink-faint'
          }`}
        >
          <X size={15} strokeWidth={1.9} />
        </button>
      </div>

      {/* document tabs */}
      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-stretch gap-[12px] pl-[6px]">
        <div className="scroll-thin flex min-w-0 items-stretch overflow-x-auto no-scrollbar">
          {tabs.map((tabId) => {
            const node = nodes[tabId]
            if (!node) return null
            const active = tabId === activeTabId
            return (
              <div key={tabId} className="anim-tab-in group relative flex items-stretch">
                <button
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  title={node.name}
                  className={`no-drag flex h-full items-center gap-[9px] whitespace-nowrap rounded-t-[9px] px-[15px] text-[14px] transition-colors ${
                    active
                      ? 'bg-elevated text-ink'
                      : 'text-ink-mute hover:bg-hover hover:text-ink-soft'
                  }`}
                >
                  <TabGlyph icon={node.icon ?? 'plain'} active={active} />
                  <span className="max-w-[190px] truncate">{node.name}</span>
                </button>
                <button
                  type="button"
                  aria-label={t('palette.closeTab', 'Close tab')}
                  title={`${t('palette.closeTab', 'Close tab')} · ${formatBinding(bindings['close-tab'])}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tabId)
                  }}
                  className="no-drag absolute right-[3px] top-1/2 hidden h-[17px] w-[17px] -translate-y-1/2 place-items-center rounded-[4px] text-ink-mute transition-colors hover:bg-hover-strong hover:text-ink group-hover:grid"
                >
                  <X size={11} strokeWidth={2.1} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            aria-label={t('titlebar.newTab', 'New note')}
            title={`${t('titlebar.newTab', 'New note')} · ${formatBinding(bindings['create-note'])}`}
            onClick={() => createNote()}
            className="no-drag my-auto ml-[9px] grid h-[24px] w-[24px] shrink-0 place-items-center rounded-[6px] text-ink-mute transition-colors hover:bg-hover hover:text-ink"
          >
            <Plus size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* palette hint */}
      <div
        data-tauri-drag-region
        className="flex shrink-0 items-center justify-end overflow-hidden pr-[13px] transition-[width] duration-200"
        style={{ width: rightOpen ? 280 : 0 }}
      >
        {rightOpen && (
          <button
            type="button"
            onClick={() => setPaletteOpen(!paletteOpen)}
            title={`${t('titlebar.palette', 'Command palette')} (${paletteBinding})`}
            className="no-drag h-[24px] rounded-[7px] border border-line bg-surface-2 px-[9px] text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink"
          >
            {paletteBinding}
          </button>
        )}
      </div>
    </header>
  )
}
