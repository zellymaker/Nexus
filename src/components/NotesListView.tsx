import { useMemo, useState } from 'react'
import {
  Copy,
  File,
  FileText,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react'
import { sortNodeIds, useStore } from '../lib/store'
import type { ViewState, WsNode } from '../lib/store'
import { useT } from '../lib/i18n'
import { formatRelative, wordCountLabel } from '../lib/format'
import { ContextMenu } from './ui/ContextMenu'
import type { MenuItem } from './ui/ContextMenu'

interface NotesListViewProps {
  view: Extract<ViewState, { kind: 'list' }>
}

/** List pages: All Notes / Favorites / Recent / folder contents / search. */
export function NotesListView({ view }: NotesListViewProps) {
  const nodes = useStore((s) => s.nodes)
  const favorites = useStore((s) => s.favorites)
  const searchQuery = useStore((s) => s.searchQuery)
  const settings = useStore((s) => s.settings)
  const openNote = useStore((s) => s.openNote)
  const duplicateNode = useStore((s) => s.duplicateNode)
  const requestDelete = useStore((s) => s.requestDelete)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const t = useT()

  const [menu, setMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)

  const notes = useMemo(() => {
    let list: WsNode[] = []
    const allNotes = Object.values(nodes).filter((n) => n.kind === 'note')
    switch (view.filter) {
      case 'favorites':
        list = allNotes.filter((n) => favorites.includes(n.id))
        break
      case 'recent':
        list = [...allNotes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20)
        break
      case 'folder': {
        const folder = view.folderId ? nodes[view.folderId] : undefined
        list = folder
          ? sortNodeIds(nodes, folder.childIds, settings.workspace.sortFiles, settings.workspace.sortFiles)
              .map((id) => nodes[id])
              .filter((n): n is WsNode => !!n && n.kind === 'note')
          : []
        break
      }
      default:
        list = sortNodeIds(
          nodes,
          allNotes.map((n) => n.id),
          settings.workspace.sortFiles,
          settings.workspace.sortFiles,
        )
          .map((id) => nodes[id])
          .filter(Boolean)
    }
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      list = list.filter((n) => {
        if (n.name.toLowerCase().includes(query)) return true
        const text = (n.content ?? '').replace(/<[^>]*>/g, ' ').toLowerCase()
        return text.includes(query)
      })
    }
    return list
  }, [nodes, view, favorites, settings.workspace.sortFiles, searchQuery])

  const emptyText =
    view.filter === 'favorites'
      ? t('view.emptyFavorites', 'No favorite notes yet.')
      : view.filter === 'recent'
        ? t('view.emptyRecent', 'No recently edited notes.')
        : view.filter === 'folder'
          ? t('view.emptyFolder', 'This folder is empty.')
          : t('view.emptyAllNotes', 'No notes yet. Create your first one with Ctrl + N.')

  const menuItems: MenuItem[] = useMemo(() => {
    if (!menu) return []
    const node = nodes[menu.nodeId]
    if (!node) return []
    const fav = favorites.includes(node.id)
    return [
      { id: 'open', label: t('ctx.open', 'Open'), icon: File },
      { id: 'duplicate', label: t('ctx.duplicate', 'Duplicate'), icon: Copy },
      {
        id: 'favorite',
        label: fav ? t('ctx.removeFromFavorites', 'Remove from favorites') : t('ctx.addToFavorites', 'Add to favorites'),
        icon: fav ? StarOff : Star,
      },
      {
        id: 'delete',
        label: t('ctx.delete', 'Delete'),
        icon: Trash2,
        danger: true,
        separatorBefore: true,
      },
    ]
  }, [menu, nodes, favorites, t])

  const onMenuSelect = (id: string) => {
    if (!menu) return
    const nodeId = menu.nodeId
    setMenu(null)
    if (id === 'open') openNote(nodeId)
    else if (id === 'duplicate') duplicateNode(nodeId)
    else if (id === 'favorite') toggleFavorite(nodeId)
    else if (id === 'delete') requestDelete([nodeId])
  }

  if (!notes.length) {
    return (
      <div className="anim-view-in flex max-w-[760px] flex-col items-start gap-3 rounded-xl border border-dashed border-line px-4 py-6">
        <FileText size={20} className="text-ink-mute" />
        <p className="text-[13px] text-ink-mute">{emptyText}</p>
      </div>
    )
  }

  return (
    <>
      <div className="anim-view-in flex max-w-[820px] flex-col gap-[2px]">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => openNote(note.id)}
            onContextMenu={(event) => {
              event.preventDefault()
              setMenu({ x: event.clientX, y: event.clientY, nodeId: note.id })
            }}
            className="group flex h-[calc(52px*var(--density-scale,1))] items-center justify-between gap-4 rounded-[8px] px-[11px] text-left transition-colors hover:bg-hover"
          >
            <span className="flex min-w-0 items-center gap-[11px]">
              {favorites.includes(note.id) ? (
                <Star size={15} className="shrink-0 text-warn" />
              ) : (
                <FileText size={15} strokeWidth={1.7} className="shrink-0 text-ink-dim group-hover:text-ink-soft" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] text-ink-soft group-hover:text-ink">
                  {note.name}
                </span>
                <span className="mt-[1px] block truncate text-[11.5px] text-ink-mute">
                  {wordCountLabel(note, t)} · {formatRelative(note.updatedAt, t)}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-[11.5px] text-ink-faint">
              {(note.meta?.tags ?? []).slice(0, 2).join('  ')}
            </span>
          </button>
        ))}
      </div>

      <ContextMenu
        open={!!menu}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={menuItems}
        onSelect={onMenuSelect}
        onClose={() => setMenu(null)}
      />
    </>
  )
}
