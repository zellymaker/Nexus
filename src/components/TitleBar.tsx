import { File, PanelLeft, Plus, X } from 'lucide-react'
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
} from '../lib/window'
import type { TabIcon } from '../lib/data'

export interface TabInfo {
  id: string
  title: string
  icon: TabIcon
}

interface TitleBarProps {
  tabs: TabInfo[]
  activeTabId: string
  leftOpen: boolean
  rightOpen: boolean
  paletteHintVisible: boolean
  onSelectTab: (id: string) => void
  onNewTab: () => void
  onToggleLeft: () => void
  onToggleRight: () => void
  onOpenPalette: () => void
}

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
        className={`h-[16px] w-[16px] shrink-0 ${
          active ? 'text-[#a9a3ff]' : 'text-[#74747e]'
        }`}
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
  return (
    <File
      size={16}
      strokeWidth={1.6}
      className={active ? 'text-[#b3aaff]' : 'text-[#74747e]'}
    />
  )
}

function TrafficLights() {
  const dot =
    'h-[9px] w-[9px] rounded-full bg-[#4b4c54] ring-1 ring-inset ring-white/[0.07] transition-colors'
  return (
    <div className="no-drag flex items-center gap-[6px]">
      <button
        type="button"
        aria-label="Close window"
        title="Close"
        onClick={closeWindow}
        className={`${dot} hover:bg-[#e06767]`}
      />
      <button
        type="button"
        aria-label="Minimize window"
        title="Minimize"
        onClick={minimizeWindow}
        className={`${dot} hover:bg-[#d9b25f]`}
      />
      <button
        type="button"
        aria-label="Maximize window"
        title="Maximize"
        onClick={toggleMaximizeWindow}
        className={`${dot} hover:bg-[#6fbf7b]`}
      />
    </div>
  )
}

export function TitleBar({
  tabs,
  activeTabId,
  leftOpen,
  rightOpen,
  paletteHintVisible,
  onSelectTab,
  onNewTab,
  onToggleLeft,
  onToggleRight,
  onOpenPalette,
}: TitleBarProps) {
  return (
    <header
      data-tauri-drag-region
      className="flex h-[36px] shrink-0 items-stretch border-b border-line bg-win"
    >
      {/* left section — window controls */}
      <div
        data-tauri-drag-region
        className="flex shrink-0 items-center pl-[14px] pr-[10px] transition-[width] duration-200"
        style={{ width: leftOpen ? 244 : 132 }}
      >
        <TrafficLights />
        <button
          type="button"
          aria-label="Toggle left sidebar"
          title="Toggle left sidebar"
          onClick={onToggleLeft}
          className={`no-drag ml-[28px] grid h-[22px] w-[22px] place-items-center rounded-[5px] transition-colors hover:bg-white/[0.07] ${
            leftOpen ? 'text-[#b9b9c2]' : 'text-[#75757f]'
          }`}
        >
          <PanelLeft size={16} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          aria-label="Toggle right sidebar"
          title="Toggle right sidebar"
          onClick={onToggleRight}
          className={`no-drag ml-auto grid h-[22px] w-[22px] place-items-center rounded-[5px] transition-colors hover:bg-white/[0.07] ${
            rightOpen ? 'text-[#b9b9c2]' : 'text-[#75757f]'
          }`}
        >
          <X size={15} strokeWidth={1.9} />
        </button>
      </div>

      {/* center section — document tabs */}
      <div
        data-tauri-drag-region
        className="flex min-w-0 flex-1 items-stretch pl-[6px]"
      >
        <div className="flex min-w-0 items-stretch gap-[12px] overflow-hidden">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                title={tab.title}
                className={`no-drag group relative flex h-full items-center gap-[9px] whitespace-nowrap rounded-t-[9px] px-[15px] text-[14px] transition-colors ${
                  active
                    ? 'bg-tab-active text-[#f0f0f4]'
                    : 'text-[#7e7e88] hover:bg-white/[0.035] hover:text-[#c4c4cc]'
                }`}
              >
                <TabGlyph icon={tab.icon} active={active} />
                <span className="max-w-[190px] truncate">{tab.title}</span>
              </button>
            )
          })}
          <button
            type="button"
            aria-label="New tab"
            title="New note"
            onClick={onNewTab}
            className="no-drag my-auto ml-[9px] grid h-[24px] w-[24px] place-items-center rounded-[6px] text-[#8c8c96] transition-colors hover:bg-white/[0.07] hover:text-[#d3d3da]"
          >
            <Plus size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* right section — palette hint */}
      <div
        data-tauri-drag-region
        className="flex shrink-0 items-center justify-end overflow-hidden pr-[13px] transition-[width] duration-200"
        style={{ width: rightOpen ? 280 : 0 }}
      >
        {paletteHintVisible && (
          <button
            type="button"
            onClick={onOpenPalette}
            title="Open command palette (Ctrl+P)"
            className="no-drag h-[24px] rounded-[7px] border border-white/[0.055] bg-[#26262d] px-[9px] text-[11.5px] font-medium text-[#cfcfd6] transition-colors hover:bg-[#2c2c34] hover:text-[#e6e6ea]"
          >
            Ctrl + P
          </button>
        )}
      </div>
    </header>
  )
}
