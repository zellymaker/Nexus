/**
 * Context-menu model for the canvas: object menu, connector menu and
 * empty-board menu. Kept separate from the component so the workspace stays
 * readable.
 */
import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  BringToFront,
  Copy,
  FileText,
  Group as GroupIcon,
  Maximize,
  RotateCcw,
  SendToBack,
  StickyNote,
  Trash2,
  Ungroup,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TFunction } from '../../lib/messages'
import { formatBinding } from '../../lib/shortcuts'
import type { AlignMode, CanvasDoc, Connection } from '../types'
import type { MenuGroupDef } from '../components/ContextMenu'

export interface CanvasMenuActions {
  duplicate: () => void
  copy: () => void
  paste: () => void
  deleteSelection: () => void
  deleteId: (id: string) => void
  group: () => void
  ungroup: () => void
  bringFront: () => void
  sendBack: () => void
  align: (mode: AlignMode) => void
  selectAll: () => void
  addSticky: () => void
  addDocument: () => void
  fit: () => void
  resetZoom: () => void
  exportPng: () => void
  newCanvas: () => void
  openDocument: (nodeId: string) => void
  updateConnection: (id: string, patch: Partial<Connection>) => void
}

export interface BuildCanvasMenuArgs {
  t: TFunction
  canvas: CanvasDoc
  selection: string[]
  targetId: string | null
  bindings: Record<string, string>
  clipboardAvailable: boolean
  documentTitle: (nodeId: string) => string | null
  actions: CanvasMenuActions
}

const ALIGN_ITEMS: Array<[AlignMode, LucideIcon, string, string]> = [
  ['left', AlignLeft, 'canvas.align.left', 'Left'],
  ['center', AlignCenter, 'canvas.align.center', 'Center'],
  ['right', AlignRight, 'canvas.align.right', 'Right'],
  ['top', AlignStartVertical, 'canvas.align.top', 'Top'],
  ['middle', AlignCenterVertical, 'canvas.align.middle', 'Middle'],
  ['bottom', AlignEndVertical, 'canvas.align.bottom', 'Bottom'],
]

export function buildCanvasMenu({
  t,
  canvas,
  selection,
  targetId,
  bindings,
  clipboardAvailable,
  documentTitle,
  actions,
}: BuildCanvasMenuArgs): MenuGroupDef[] {
  const groups: MenuGroupDef[] = []
  const shortcut = (id: string) => formatBinding(bindings[id])
  const targetObject = targetId
    ? canvas.objects.find((object) => object.id === targetId)
    : undefined
  const targetConnection = targetId
    ? canvas.connections.find((connection) => connection.id === targetId)
    : undefined
  const selectedObjects = canvas.objects.filter((object) => selection.includes(object.id))
  const hasSelection = selection.length > 0

  const alignGroup: MenuGroupDef = {
    label: t('canvas.align.left', 'Align'),
    inline: true,
    items: ALIGN_ITEMS.map(([mode, icon, key, fallback]) => ({
      label: t(key, fallback),
      icon,
      onSelect: () => actions.align(mode),
    })),
  }

  if (targetConnection) {
    groups.push({
      label: t('canvas.tools.connector', 'Connector'),
      items: [
        {
          label: targetConnection.arrow
            ? t('canvas.connectorArrowOff', 'Plain line')
            : t('canvas.connectorArrowOn', 'With arrow'),
          onSelect: () =>
            actions.updateConnection(targetConnection.id, { arrow: !targetConnection.arrow }),
        },
        {
          label: targetConnection.dashed
            ? t('canvas.connectorSolid', 'Solid line')
            : t('canvas.connectorDashed', 'Dashed line'),
          onSelect: () =>
            actions.updateConnection(targetConnection.id, {
              dashed: !targetConnection.dashed,
            }),
        },
        {
          label: t('canvas.delete', 'Delete'),
          icon: Trash2,
          danger: true,
          shortcut: shortcut('canvas-delete'),
          onSelect: () => actions.deleteId(targetConnection.id),
        },
      ],
    })
    return groups
  }

  if (targetObject || hasSelection) {
    if (targetObject?.kind === 'document') {
      const title = documentTitle(targetObject.nodeId)
      if (title) {
        groups.push({
          items: [
            {
              label: t('canvas.openDocument', 'Open document'),
              icon: FileText,
              onSelect: () => {
                if (targetObject.kind === 'document') actions.openDocument(targetObject.nodeId)
              },
            },
          ],
        })
      }
    }
    groups.push({
      items: [
        {
          label: t('canvas.duplicate', 'Duplicate'),
          icon: Copy,
          shortcut: shortcut('duplicate-selection'),
          disabled: !hasSelection,
          onSelect: actions.duplicate,
        },
        {
          label: t('canvas.copy', 'Copy'),
          shortcut: 'Ctrl+C',
          disabled: !hasSelection,
          onSelect: actions.copy,
        },
        {
          label: t('canvas.delete', 'Delete'),
          icon: Trash2,
          danger: true,
          shortcut: shortcut('canvas-delete'),
          disabled: !hasSelection,
          onSelect: actions.deleteSelection,
        },
      ],
    })
    groups.push({
      label: t('canvas.objects', 'Arrange'),
      items: [
        {
          label: t('canvas.group', 'Group'),
          icon: GroupIcon,
          shortcut: shortcut('canvas-group'),
          disabled: selectedObjects.length < 2,
          onSelect: actions.group,
        },
        {
          label: t('canvas.ungroup', 'Ungroup'),
          icon: Ungroup,
          shortcut: shortcut('canvas-ungroup'),
          disabled: !selectedObjects.some((object) => object.groupId),
          onSelect: actions.ungroup,
        },
        {
          label: t('canvas.bringFront', 'Bring to front'),
          icon: BringToFront,
          onSelect: actions.bringFront,
        },
        {
          label: t('canvas.sendBack', 'Send to back'),
          icon: SendToBack,
          onSelect: actions.sendBack,
        },
      ],
    })
    if (selectedObjects.length) groups.push(alignGroup)
    return groups
  }

  groups.push({
    items: [
      {
        label: t('canvas.tools.sticky', 'Add sticky'),
        icon: StickyNote,
        onSelect: actions.addSticky,
      },
      {
        label: t('canvas.addDocument', 'Add document'),
        icon: FileText,
        onSelect: actions.addDocument,
      },
      {
        label: t('canvas.paste', 'Paste'),
        disabled: !clipboardAvailable,
        onSelect: actions.paste,
      },
      {
        label: t('canvas.selectAllObjects', 'Select all'),
        shortcut: 'Ctrl+A',
        onSelect: actions.selectAll,
      },
      {
        label: t('canvas.new', 'New canvas'),
        onSelect: actions.newCanvas,
      },
    ],
  })
  groups.push({
    items: [
      {
        label: t('canvas.fit', 'Fit to content'),
        icon: Maximize,
        shortcut: shortcut('canvas-center'),
        onSelect: actions.fit,
      },
      {
        label: t('canvas.resetZoom', 'Reset zoom'),
        icon: RotateCcw,
        shortcut: shortcut('canvas-reset-zoom'),
        onSelect: actions.resetZoom,
      },
      {
        label: t('canvas.exportPng', 'Export PNG'),
        onSelect: actions.exportPng,
      },
    ],
  })
  return groups
}
