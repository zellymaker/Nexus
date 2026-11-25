import {
  ChevronRight,
  Clock,
  File,
  Folder,
  House,
  Menu,
  NotebookText,
  Settings,
  Share2,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TreeNode } from '../lib/data'
import { GraphPreview } from './GraphPreview'

export type NavId =
  | 'home'
  | 'all'
  | 'favorites'
  | 'recent'
  | 'graph'
  | 'daily'
  | 'settings'

interface NavItem {
  id: NavId
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'all', label: 'All Notes', icon: Star },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'graph', label: 'Graph View', icon: Share2 },
]

interface LeftSidebarProps {
  activeNav: NavId
  tree: TreeNode[]
  foldersOpen: Record<string, boolean>
  onNav: (id: NavId) => void
  onToggleFolder: (id: string) => void
  onOpenNote: (noteId: string) => void
  onOpenGraph: () => void
  onOpenSettings: () => void
  onOpenMenu: () => void
}

function NexusMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true">
      <defs>
        <linearGradient id="nexus-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c0b3ff" />
          <stop offset="55%" stopColor="#8d7dff" />
          <stop offset="100%" stopColor="#6a5ae0" />
        </linearGradient>
      </defs>
      <path
        d="M6 19.5 6 4.5 18 19.5 18 4.5"
        fill="none"
        stroke="url(#nexus-mark)"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LeftSidebar({
  activeNav,
  tree,
  foldersOpen,
  onNav,
  onToggleFolder,
  onOpenNote,
  onOpenGraph,
  onOpenSettings,
  onOpenMenu,
}: LeftSidebarProps) {
  const renderTree = (nodes: TreeNode[], level: number) =>
    nodes.map((node) => {
      const open = foldersOpen[node.id] ?? false
      if (node.kind === 'folder') {
        return (
          <div key={node.id}>
            <button
              type="button"
              onClick={() => onToggleFolder(node.id)}
              className="flex h-[27px] w-full items-center gap-[7px] rounded-[6px] text-left text-[14px] text-[#ceced6] transition-colors hover:bg-white/[0.045] hover:text-[#e2e2e8]"
              style={{ paddingLeft: 6 + level * 16 }}
            >
              <ChevronRight
                size={12}
                strokeWidth={2}
                className={`shrink-0 text-[#7d7d87] transition-transform duration-150 ${
                  open ? 'rotate-90' : ''
                }`}
              />
              <Folder
                size={15}
                strokeWidth={1.6}
                className="shrink-0 text-[#9a9aa4]"
              />
              <span className="truncate">{node.name}</span>
            </button>
            {open &&
              node.children &&
              node.children.length > 0 &&
              renderTree(node.children, level + 1)}
          </div>
        )
      }
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => node.noteId && onOpenNote(node.noteId)}
          className="flex h-[27px] w-full items-center gap-[8px] rounded-[6px] text-left text-[14px] text-[#ceced6] transition-colors hover:bg-white/[0.045] hover:text-[#e2e2e8]"
          style={{ paddingLeft: 6 + level * 16 + 19 }}
        >
          <File
            size={14}
            strokeWidth={1.6}
            className="shrink-0 text-[#9a9aa4]"
          />
          <span className="truncate">{node.name}</span>
        </button>
      )
    })

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-pane-left">
      {/* brand */}
      <div className="flex shrink-0 items-center px-[14px] pb-[6px] pt-[15px]">
        <NexusMark />
        <span className="ml-[9px] text-[18px] font-semibold tracking-[0.14em] text-[#f1f1f5]">
          NEXUS
        </span>
        <button
          type="button"
          aria-label="Open menu"
          title="Menu"
          onClick={onOpenMenu}
          className="ml-auto grid h-[24px] w-[24px] place-items-center rounded-[6px] text-[#a9a9b3] transition-colors hover:bg-white/[0.06] hover:text-[#e2e2e8]"
        >
          <Menu size={17} strokeWidth={1.7} />
        </button>
      </div>

      {/* primary navigation */}
      <nav className="mt-[7px] flex shrink-0 flex-col gap-[2px] px-[10px]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = activeNav === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNav(item.id)}
              className={`flex h-[31px] w-full items-center gap-[11px] rounded-[8px] px-[7px] text-[15px] transition-colors ${
                active
                  ? 'bg-[#202027] font-medium text-[#ececf1]'
                  : 'text-[#c4c4cc] hover:bg-white/[0.045] hover:text-[#e2e2e8]'
              }`}
            >
              <Icon
                size={19}
                strokeWidth={1.7}
                className={active ? 'text-[#d9d9e0]' : 'text-[#a3a3ad]'}
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* graph preview card */}
      <button
        type="button"
        aria-label="Open graph view"
        title="Open graph view"
        onClick={onOpenGraph}
        className="mx-[12px] mt-[13px] block h-[102px] shrink-0 overflow-hidden rounded-[10px] transition-opacity hover:opacity-90"
      >
        <GraphPreview className="h-full w-full" />
      </button>

      {/* daily notes */}
      <button
        type="button"
        onClick={() => onNav('daily')}
        className="mt-[26px] flex h-[31px] w-[calc(100%-16px)] items-center gap-[11px] rounded-[8px] px-[7px] text-[15px] text-[#ceced6] transition-colors hover:bg-white/[0.045] hover:text-[#e2e2e8] mx-[8px]"
      >
        <NotebookText
          size={17}
          strokeWidth={1.6}
          className="shrink-0 text-[#a3a3ad]"
        />
        <span className="truncate">Daily Notes</span>
      </button>

      {/* workspace explorer */}
      <div className="mt-[24px] flex shrink-0 items-center gap-[9px] px-[15px]">
        <Folder size={16} strokeWidth={1.6} className="text-[#a3a3ad]" />
        <span className="text-[13.5px] font-medium tracking-[0.01em] text-[#c9c9d2]">
          Workspace Explorer
        </span>
      </div>

      <div className="scroll-thin mt-[7px] flex-1 overflow-y-auto px-[10px] pb-[8px]">
        {renderTree(tree, 0)}
      </div>

      {/* footer */}
      <button
        type="button"
        onClick={onOpenSettings}
        className={`mx-[8px] mb-[9px] flex h-[34px] shrink-0 items-center gap-[11px] rounded-[8px] px-[7px] text-[15px] transition-colors ${
          activeNav === 'settings'
            ? 'bg-[#202027] font-medium text-[#ececf1]'
            : 'text-[#c4c4cc] hover:bg-white/[0.045] hover:text-[#e2e2e8]'
        }`}
      >
        <Settings size={17} strokeWidth={1.6} className="text-[#a3a3ad]" />
        <span>Settings</span>
      </button>
    </aside>
  )
}
