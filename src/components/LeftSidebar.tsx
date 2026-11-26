import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  Clock,
  Copy,
  FilePlus2,
  Files,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  House,
  LayoutGrid,
  Menu,
  NotebookText,
  Pencil,
  Settings,
  Share2,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  flattenTree,
  useStore,
  useBindings,
} from '../lib/store'
import type { NavId } from '../lib/store'
import { useT } from '../lib/i18n'
import { formatBinding } from '../lib/shortcuts'
import { GraphPreview } from './GraphPreview'
import { ContextMenu } from './ui/ContextMenu'
import type { MenuItem } from './ui/ContextMenu'
import type { WsNode } from '../lib/store'

const NAV_ITEMS: { id: NavId; labelKey: string; fallback: string; icon: LucideIcon }[] = [
  { id: 'home', labelKey: 'nav.home', fallback: 'Home', icon: House },
  { id: 'all', labelKey: 'nav.allNotes', fallback: 'All Notes', icon: Star },
  { id: 'favorites', labelKey: 'nav.favorites', fallback: 'Favorites', icon: Star },
  { id: 'recent', labelKey: 'nav.recent', fallback: 'Recent', icon: Clock },
  { id: 'canvas', labelKey: 'nav.graph', fallback: 'Graph View', icon: Share2 },
]

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

interface MenuState {
  x: number
  y: number
  nodeId: string | null
}

/** Left navigation + full Workspace Explorer (multi-select, rename, delete). */
export function LeftSidebar() {
  const nodes = useStore((s) => s.nodes)
  const rootIds = useStore((s) => s.rootIds)
  const expanded = useStore((s) => s.expanded)
  const selectedIds = useStore((s) => s.selectedIds)
  const editingNodeId = useStore((s) => s.editingNodeId)
  const activeNav = useStore((s) => s.activeNav)
  const activeTabId = useStore((s) => s.activeTabId)
  const settings = useStore((s) => s.settings)
  const favorites = useStore((s) => s.favorites)
  const toggleFolder = useStore((s) => s.toggleFolder)
  const select = useStore((s) => s.select)
  const toggleSelect = useStore((s) => s.toggleSelect)
  const openNote = useStore((s) => s.openNote)
  const startRename = useStore((s) => s.startRename)
  const commitRename = useStore((s) => s.commitRename)
  const cancelRename = useStore((s) => s.cancelRename)
  const duplicateNode = useStore((s) => s.duplicateNode)
  const requestDelete = useStore((s) => s.requestDelete)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const createNote = useStore((s) => s.createNote)
  const createFolder = useStore((s) => s.createFolder)
  const setView = useStore((s) => s.setView)
  const setNav = useStore((s) => s.setNav)
  const setPaletteOpen = useStore((s) => s.setPaletteOpen)
  const pushToast = useStore((s) => s.pushToast)
  const updateSettings = useStore((s) => s.updateSettings)

  const bindings = useBindings()
  const t = useT()
  const [menu, setMenu] = useState<MenuState | null>(null)
  const anchorRef = useRef<string | null>(null)

  /* visible roots: hidden notes appear when the setting is on */
  const visibleRoots = useMemo(() => {
    const hidden = settings.workspace.showHidden
      ? Object.values(nodes)
          .filter((n) => n.kind === 'note' && n.parentId === null && !rootIds.includes(n.id))
          .map((n) => n.id)
      : []
    return [...rootIds, ...hidden]
  }, [nodes, rootIds, settings.workspace.showHidden])

  const flat = useMemo(
    () =>
      flattenTree(
        nodes,
        visibleRoots,
        expanded,
        settings.workspace.sortFiles,
        settings.workspace.sortFolders,
      ),
    [nodes, visibleRoots, expanded, settings.workspace.sortFiles, settings.workspace.sortFolders],
  )

  const flatIds = useMemo(() => flat.map((item) => item.node.id), [flat])

  const firstSelectedFolder = () =>
    selectedIds.find((id) => nodes[id]?.kind === 'folder') ?? null

  /* reveal the active note in the explorer (optional setting) */
  useEffect(() => {
    if (!settings.workspace.revealActive || !activeTabId) return
    const active = nodes[activeTabId]
    if (!active) return
    // expand ancestors
    let parent = active.parentId
    while (parent) {
      if (!expanded[parent]) setExpandedLocal(parent)
      parent = nodes[parent]?.parentId ?? null
    }
    const timer = window.setTimeout(() => {
      const row = document.querySelector<HTMLElement>(`[data-node-id="${activeTabId}"]`)
      row?.scrollIntoView({ block: 'nearest' })
    }, 60)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, settings.workspace.revealActive])

  const setExpandedLocal = (id: string) => {
    const state = useStore.getState()
    if (!state.expanded[id]) state.setExpanded(id, true)
  }

  const goNav = (id: NavId) => {
    setMenu(null)
    switch (id) {
      case 'home':
        setNav('home')
        setView({ kind: 'note' })
        break
      case 'all':
        setNav('all')
        setView({ kind: 'list', title: t('view.allNotes', 'All Notes'), filter: 'all' })
        break
      case 'favorites':
        setNav('favorites')
        setView({ kind: 'list', title: t('view.favorites', 'Favorites'), filter: 'favorites' })
        break
      case 'recent':
        setNav('recent')
        setView({ kind: 'list', title: t('view.recent', 'Recent'), filter: 'recent' })
        break
      case 'canvas':
        setNav('canvas')
        setView({ kind: 'canvas' })
        break
      case 'daily': {
        const daily =
          Object.values(nodes).find((n) => n.kind === 'note' && n.name === 'Daily Notes') ??
          null
        if (daily) openNote(daily.id)
        else {
          const id = createNote(null, 'Daily Notes')
          setNav('daily')
          void id
        }
        break
      }
      case 'settings':
        setNav('settings')
        setView({ kind: 'settings', section: 'general' })
        break
    }
  }

  /* -------------------------- selection -------------------------- */

  const handleRowClick = (event: React.MouseEvent, node: WsNode) => {
    const multi = event.ctrlKey || event.metaKey
    if (multi) {
      toggleSelect(node.id)
      anchorRef.current = node.id
      return
    }
    if (event.shiftKey && anchorRef.current) {
      const from = flatIds.indexOf(anchorRef.current)
      const to = flatIds.indexOf(node.id)
      if (from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from]
        select(flatIds.slice(start, end + 1))
        return
      }
    }
    anchorRef.current = node.id
    select([node.id])
    if (node.kind === 'note') {
      openNote(node.id)
    } else if (settings.workspace.expandOnClick) {
      toggleFolder(node.id)
    }
  }

  /* ------------------------- context menu ------------------------ */

  const openMenu = (event: React.MouseEvent, nodeId: string | null) => {
    event.preventDefault()
    event.stopPropagation()
    if (nodeId && !selectedIds.includes(nodeId)) select([nodeId])
    setMenu({ x: event.clientX, y: event.clientY, nodeId })
  }

  const menuItems: MenuItem[] = useMemo(() => {
    if (!menu) return []
    const node = menu.nodeId ? nodes[menu.nodeId] : null
    const items: MenuItem[] = []
    if (node) {
      items.push(
        {
          id: 'open',
          label: node.kind === 'note' ? t('ctx.open', 'Open') : expanded[node.id] ? t('folder.collapse', 'Collapse folder') : t('folder.expand', 'Expand folder'),
          icon: node.kind === 'note' ? File : FolderOpen,
        },
        { id: 'rename', label: t('ctx.rename', 'Rename'), icon: Pencil, shortcut: formatBinding(bindings['rename-selection']) },
        { id: 'duplicate', label: t('ctx.duplicate', 'Duplicate'), icon: Copy, shortcut: formatBinding(bindings['duplicate-selection']) },
        {
          id: 'favorite',
          label: favorites.includes(node.id)
            ? t('ctx.removeFromFavorites', 'Remove from favorites')
            : t('ctx.addToFavorites', 'Add to favorites'),
          icon: favorites.includes(node.id) ? StarOff : Star,
        },
      )
      if (node.kind === 'folder') {
        items.push(
          { id: 'new-note', label: t('ctx.newNoteHere', 'New note here'), icon: FilePlus2, separatorBefore: true },
          { id: 'new-folder', label: t('ctx.newFolderHere', 'New folder here'), icon: FolderPlus },
        )
      }
      items.push({
        id: 'delete',
        label: t('ctx.delete', 'Delete'),
        icon: Trash2,
        danger: true,
        separatorBefore: true,
        shortcut: formatBinding(bindings['delete-selection']),
      })
    } else {
      items.push(
        { id: 'new-note', label: t('ctx.newNoteHere', 'New note here'), icon: FilePlus2 },
        { id: 'new-folder', label: t('ctx.newFolderHere', 'New folder here'), icon: FolderPlus },
        { id: 'new-canvas', label: t('ctx.newCanvasHere', 'New Canvas here'), icon: LayoutGrid },
        { id: 'toggle-hidden', label: settings.workspace.showHidden ? 'Hide hidden notes' : 'Show hidden notes', icon: Files, separatorBefore: true },
      )
    }
    return items
  }, [menu, nodes, expanded, favorites, bindings, t, settings.workspace.showHidden])

  const handleMenuSelect = (id: string) => {
    const node = menu?.nodeId ? nodes[menu.nodeId] : null
    setMenu(null)
    switch (id) {
      case 'open':
        if (!node) return
        if (node.kind === 'note') openNote(node.id)
        else toggleFolder(node.id)
        break
      case 'rename':
        if (node) startRename(node.id)
        break
      case 'duplicate':
        if (node) {
          const clone = duplicateNode(node.id)
          if (clone) pushToast({ title: t('toast.duplicated', 'Duplicated').replace('{name}', nodes[clone]?.name ?? node.name), tone: 'default' })
        }
        break
      case 'favorite':
        if (node) {
          toggleFavorite(node.id)
          pushToast({
            title: favorites.includes(node.id)
              ? t('toast.favoriteRemoved', 'Removed from favorites')
              : t('toast.favoriteAdded', 'Added to favorites'),
            tone: 'default',
          })
        }
        break
      case 'new-note':
        createNote(node?.kind === 'folder' ? node.id : null)
        break
      case 'new-folder':
        createFolder(node?.kind === 'folder' ? node.id : null)
        break
      case 'new-canvas':
        window.dispatchEvent(new CustomEvent('nexus:canvas-create'))
        setNav('canvas')
        setView({ kind: 'canvas' })
        break
      case 'toggle-hidden':
        updateSettings({ workspace: { showHidden: !settings.workspace.showHidden } })
        break
      case 'delete':
        requestDelete(node ? [node.id] : selectedIds)
        break
    }
  }

  /* ---------------------------- render --------------------------- */

  const renderRows = (items: { node: WsNode; depth: number }[]) => {
    const rows: React.ReactNode[] = []
    for (const { node, depth } of items) {
      const isFolder = node.kind === 'folder'
      const isOpen = !!expanded[node.id]
      const selected = selectedIds.includes(node.id)
      const isActive = node.id === activeTabId
      const isEditing = editingNodeId === node.id
      const childItems = isFolder && isOpen ? flat.filter((i) => i.node.parentId === node.id) : []

      rows.push(
        <div key={node.id} className="relative">
          <div
            role="treeitem"
            data-node-id={node.id}
            aria-selected={selected}
            aria-expanded={isFolder ? isOpen : undefined}
            tabIndex={-1}
            onClick={(event) => handleRowClick(event, node)}
            onContextMenu={(event) => openMenu(event, node.id)}
            className={`group/row flex w-full items-center gap-[7px] rounded-[6px] pr-1 text-left text-[13.5px] transition-colors ${
              Date.now() - node.createdAt < 2500 ? 'anim-fade-in' : ''
            } ${
              selected || isActive
                ? 'bg-hover-strong text-ink'
                : 'text-ink-soft hover:bg-hover'
            }`}
            style={{ height: 'var(--row-h)', paddingLeft: isFolder ? 6 + depth * 16 : 6 + depth * 16 + 19 }}
          >
            {isFolder ? (
              <button
                type="button"
                aria-label={isOpen ? t('folder.collapse', 'Collapse folder') : t('folder.expand', 'Expand folder')}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleFolder(node.id)
                }}
                className="grid h-[16px] w-[12px] shrink-0 place-items-center text-ink-mute transition-colors hover:text-ink"
              >
                <ChevronRight
                  size={12}
                  strokeWidth={2}
                  className={`transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className="w-0 shrink-0" />
            )}
            {isFolder ? (
              isOpen ? (
                <FolderOpen size={15} strokeWidth={1.6} className="shrink-0 text-ink-dim" />
              ) : (
                <Folder size={15} strokeWidth={1.6} className="shrink-0 text-ink-dim" />
              )
            ) : (
              <File size={14} strokeWidth={1.6} className="shrink-0 text-ink-dim" />
            )}

            {isEditing ? (
              <RenameInput
                initial={node.name}
                onCommit={(value) => commitRename(value)}
                onCancel={cancelRename}
              />
            ) : (
              <span
                className="min-w-0 flex-1 truncate"
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  startRename(node.id)
                }}
              >
                {node.name}
              </span>
            )}

            {isFolder && !isOpen && node.childIds.length > 0 && (
              <span className="shrink-0 pr-1 text-[10.5px] text-ink-faint">
                {node.childIds.length}
              </span>
            )}

            {!isEditing && (
              <button
                type="button"
                aria-label={t('common.delete', 'Delete')}
                title={t('common.delete', 'Delete')}
                onClick={(event) => {
                  event.stopPropagation()
                  requestDelete([node.id])
                }}
                className="hidden h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] text-ink-mute hover:bg-danger/15 hover:text-danger group-hover/row:grid"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {isFolder && childItems.length > 0 && (
            <div className={`tree-children ${isOpen ? 'open' : ''}`}>
              <div className="tree-children-inner">{renderRows(childItems)}</div>
            </div>
          )}
          {isFolder && isOpen && childItems.length === 0 && (
            <p
              className="py-[3px] text-[12px] italic text-ink-faint"
              style={{ paddingLeft: 6 + (depth + 1) * 16 + 19 }}
            >
              {t('explorer.emptyFolder', 'Empty')}
            </p>
          )}
        </div>,
      )
    }
    return rows
  }

  const sidebarIconButton =
    'grid h-[22px] w-[22px] place-items-center rounded-[5px] text-ink-mute transition-colors hover:bg-hover hover:text-ink'

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-side-left">
      {/* brand */}
      <div className="flex shrink-0 items-center px-[14px] pb-[6px] pt-[15px]">
        <NexusMark />
        <span className="ml-[9px] text-[18px] font-semibold tracking-[0.14em] text-ink">NEXUS</span>
        <button
          type="button"
          aria-label={t('nav.menu', 'Menu')}
          title={t('titlebar.palette', 'Command palette')}
          onClick={() => setPaletteOpen(true)}
          className={`ml-auto ${sidebarIconButton}`}
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
              onClick={() => goNav(item.id)}
              className={`flex w-full items-center gap-[11px] rounded-[8px] px-[7px] text-[15px] transition-colors ${
                active ? 'bg-elevated font-medium text-ink' : 'text-ink-soft hover:bg-hover hover:text-ink'
              }`}
              style={{ height: 31 }}
            >
              <Icon size={19} strokeWidth={1.7} className={active ? 'text-ink' : 'text-ink-dim'} />
              <span className="truncate">{t(item.labelKey, item.fallback)}</span>
            </button>
          )
        })}
      </nav>

      {/* mini canvas / graph card */}
      <button
        type="button"
        aria-label={t('palette.openCanvas', 'Open Canvas')}
        title={t('palette.openCanvas', 'Open Canvas')}
        onClick={() => {
          setNav('canvas')
          setView({ kind: 'canvas' })
        }}
        className="mx-[12px] mt-[13px] block h-[102px] shrink-0 overflow-hidden rounded-[10px] transition-opacity hover:opacity-90"
      >
        <GraphPreview className="h-full w-full" />
      </button>

      {/* daily notes */}
      <button
        type="button"
        onClick={() => goNav('daily')}
        className="mx-[8px] mt-[26px] flex h-[31px] w-[calc(100%-16px)] items-center gap-[11px] rounded-[8px] px-[7px] text-[15px] text-ink-soft transition-colors hover:bg-hover hover:text-ink"
      >
        <NotebookText size={17} strokeWidth={1.6} className="shrink-0 text-ink-dim" />
        <span className="truncate">{t('nav.dailyNotes', 'Daily Notes')}</span>
      </button>

      {/* workspace explorer */}
      <div className="group/explorer relative mt-[24px] flex shrink-0 items-center gap-[9px] px-[15px]">
        <Folder size={16} strokeWidth={1.6} className="text-ink-dim" />
        <span className="min-w-0 flex-1 truncate pr-[6px] text-[13.5px] font-medium tracking-[0.01em] text-ink-soft">
          {t('nav.workspaceExplorer', 'Workspace Explorer')}
        </span>
        <div className="absolute right-[8px] top-1/2 flex shrink-0 -translate-y-1/2 items-center gap-[1px] rounded-md bg-side-left pl-[4px] opacity-0 shadow-[0_0_10px_6px_var(--bg-left)] transition-opacity focus-within:opacity-100 group-hover/explorer:opacity-100">
          <button
            type="button"
            className={sidebarIconButton}
            aria-label={t('explorer.newNote', 'New note')}
            title={t('explorer.newNote', 'New note')}
            onClick={() => createNote(firstSelectedFolder())}
          >
            <FilePlus2 size={14} />
          </button>
          <button
            type="button"
            className={sidebarIconButton}
            aria-label={t('explorer.newFolder', 'New folder')}
            title={t('explorer.newFolder', 'New folder')}
            onClick={() => createFolder(firstSelectedFolder())}
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            className={sidebarIconButton}
            aria-label={t('explorer.newCanvas', 'New Canvas')}
            title={t('explorer.newCanvas', 'New Canvas')}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus:canvas-create'))
              setNav('canvas')
              setView({ kind: 'canvas' })
            }}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            className={`${sidebarIconButton} hover:text-danger`}
            aria-label={t('explorer.deleteSelected', 'Delete selected')}
            title={t('explorer.deleteSelected', 'Delete selected')}
            disabled={!selectedIds.length}
            onClick={() => requestDelete(selectedIds)}
            style={{ opacity: selectedIds.length ? 1 : 0.35 }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {selectedIds.length > 1 && (
        <p className="mt-1 px-[17px] text-[11.5px] text-accent-bright">
          {t('explorer.selected', 'Selected: {count}').replace('{count}', String(selectedIds.length))}
        </p>
      )}

      {/* tree */}
      <div
        className="scroll-thin mt-[7px] min-h-0 flex-1 overflow-y-auto px-[10px] pb-[8px]"
        role="tree"
        aria-label={t('nav.workspaceExplorer', 'Workspace Explorer')}
        onClick={(event) => {
          if (event.target === event.currentTarget) select([])
        }}
        onContextMenu={(event) => openMenu(event, null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const current = selectedIds[0] ?? activeTabId
            const index = flatIds.indexOf(current)
            const next = Math.max(0, Math.min(flatIds.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))
            const targetId = flatIds[next]
            if (targetId) {
              select([targetId])
              const node = nodes[targetId]
              if (node?.kind === 'note') openNote(targetId)
            }
          }
        }}
        tabIndex={0}
      >
        {flat.length === 0 ? (
          <div className="px-[7px] py-3 text-[12.5px] text-ink-mute">
            <p>{t('view.emptyAllNotes', 'No notes yet. Create your first one with Ctrl + N.')}</p>
            <button
              type="button"
              onClick={() => createNote(null)}
              className="mt-2 rounded-md border border-line px-2 py-1 text-[12px] text-ink-soft hover:bg-hover"
            >
              {t('explorer.newNote', 'New note')}
            </button>
          </div>
        ) : (
          renderRows(flat.filter((item) => item.depth === 0))
        )}
      </div>

      {/* footer */}
      <button
        type="button"
        onClick={() => goNav('settings')}
        className={`mx-[8px] mb-[9px] flex h-[34px] shrink-0 items-center gap-[11px] rounded-[8px] px-[7px] text-[15px] transition-colors ${
          activeNav === 'settings' ? 'bg-elevated font-medium text-ink' : 'text-ink-soft hover:bg-hover hover:text-ink'
        }`}
      >
        <Settings size={17} strokeWidth={1.6} className="text-ink-dim" />
        <span>{t('nav.settings', 'Settings')}</span>
      </button>

      <ContextMenu
        open={!!menu}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={menuItems}
        onSelect={handleMenuSelect}
        onClose={() => setMenu(null)}
      />
    </aside>
  )
}

function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string
  onCommit: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <input
      autoFocus
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onBlur={() => onCommit(value)}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Enter') {
          event.preventDefault()
          onCommit(value)
        } else if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
          /* let the input handle text editing */
        }
      }}
      className="min-w-0 flex-1 rounded-[4px] border border-accent/50 bg-surface px-1 py-[1px] text-[13px] text-ink outline-none"
      aria-label="Rename"
    />
  )
}
