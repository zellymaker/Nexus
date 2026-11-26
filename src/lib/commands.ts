/**
 * Command palette catalogue. Commands are plain objects; every command runs a
 * real store action (no dead entries). Shortcut hints are read from the
 * user's current bindings.
 */
import { useMemo } from 'react'
import {
  CircleDot,
  FilePlus2,
  FolderPlus,
  LayoutGrid,
  Plus,
  Search,
  Settings2,
  SquarePen,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from './i18n'
import { useStore, useBindings } from './store'
import { formatBinding } from './shortcuts'

export interface PaletteCommand {
  id: string
  label: string
  icon: LucideIcon
  shortcut?: string
  keywords?: string
  run: () => void
}

export function useCommands(): PaletteCommand[] {
  const t = useT()
  const bindings = useBindings()

  return useMemo(() => {
    const state = () => useStore.getState()
    const commands: PaletteCommand[] = [
      {
        id: 'create-note',
        label: t('palette.createNewNote', 'Create New Note'),
        icon: FilePlus2,
        shortcut: formatBinding(bindings['create-note']),
        keywords: 'new document note создать заметку',
        run: () => {
          const s = state()
          const target = s.selectedIds.find((id) => s.nodes[id]?.kind === 'folder') ?? null
          s.createNote(target)
          s.setPaletteOpen(false)
        },
      },
      {
        id: 'create-folder',
        label: t('palette.createNewFolder', 'Create New Folder'),
        icon: FolderPlus,
        shortcut: formatBinding(bindings['create-folder']),
        keywords: 'folder папка',
        run: () => {
          const s = state()
          const target = s.selectedIds.find((id) => s.nodes[id]?.kind === 'folder') ?? null
          s.createFolder(target)
          s.setPaletteOpen(false)
        },
      },
      {
        id: 'create-canvas',
        label: t('palette.createNewCanvas', 'Create New Canvas'),
        icon: LayoutGrid,
        shortcut: formatBinding(bindings['create-canvas']),
        keywords: 'canvas board whiteboard холст',
        run: () => {
          window.dispatchEvent(new CustomEvent('nexus:canvas-create'))
          state().setView({ kind: 'canvas' })
          state().setNav('canvas')
          state().setPaletteOpen(false)
        },
      },
      {
        id: 'open-canvas',
        label: t('palette.openCanvas', 'Open Canvas'),
        icon: CircleDot,
        keywords: 'graph canvas граф',
        run: () => {
          state().setView({ kind: 'canvas' })
          state().setNav('canvas')
          state().setPaletteOpen(false)
        },
      },
      {
        id: 'search-notes',
        label: t('palette.searchNotes', 'Search Notes'),
        icon: Search,
        shortcut: '/',
        keywords: 'find поиск',
        run: () => {
          const s = state()
          s.setRightOpen(true)
          s.setPaletteOpen(false)
          window.setTimeout(() => window.dispatchEvent(new CustomEvent('nexus:focus-search')), 40)
        },
      },
      {
        id: 'duplicate-note',
        label: t('palette.duplicate', 'Duplicate current note'),
        icon: Plus,
        shortcut: formatBinding(bindings['duplicate-selection']),
        keywords: 'copy duplicate дублировать',
        run: () => {
          const s = state()
          if (s.activeTabId) s.duplicateNode(s.activeTabId)
          s.setPaletteOpen(false)
        },
      },
      {
        id: 'delete-selection',
        label: t('palette.deleteSelection', 'Delete selection'),
        icon: Trash2,
        shortcut: formatBinding(bindings['delete-selection']),
        keywords: 'remove delete удалить',
        run: () => {
          const s = state()
          if (s.selectedIds.length) s.requestDelete(s.selectedIds)
          s.setPaletteOpen(false)
        },
      },
      {
        id: 'rename-selection',
        label: t('palette.renameSelection', 'Rename selection'),
        icon: SquarePen,
        shortcut: formatBinding(bindings['rename-selection']),
        keywords: 'rename переименовать',
        run: () => {
          const s = state()
          const id = s.selectedIds[0] ?? s.activeTabId
          if (id) s.startRename(id)
          s.setPaletteOpen(false)
        },
      },
      {
        id: 'toggle-left',
        label: t('palette.toggleLeft', 'Toggle left sidebar'),
        icon: LayoutGrid,
        shortcut: formatBinding(bindings['toggle-sidebar']),
        keywords: 'panel sidebar панель',
        run: () => {
          state().toggleLeft()
          state().setPaletteOpen(false)
        },
      },
      {
        id: 'toggle-right',
        label: t('palette.toggleRight', 'Toggle right sidebar'),
        icon: LayoutGrid,
        keywords: 'panel sidebar панель справа',
        run: () => {
          state().toggleRight()
          state().setPaletteOpen(false)
        },
      },
      {
        id: 'settings',
        label: t('palette.settings', 'Open Settings'),
        icon: Settings2,
        shortcut: formatBinding(bindings['open-settings']),
        keywords: 'preferences настройки',
        run: () => {
          const s = state()
          s.setView({ kind: 'settings', section: 'general' })
          s.setNav('settings')
          s.setPaletteOpen(false)
        },
      },
    ]
    return commands
  }, [t, bindings])
}
