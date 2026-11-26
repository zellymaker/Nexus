/**
 * NEXUS Canvas workspace — the infinite whiteboard module.
 *
 * Rendered by MainPane when `view.kind === 'canvas'`. It owns the Konva stage,
 * the canvases (multiple boards, persisted under `nexus:canvas:v1`), tools,
 * selection, inline text editing, search, context menu and canvas keyboard
 * handling. Note data is read from the main workspace store; nothing outside
 * `src/canvas/**` is written from here.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type Konva from 'konva'
import { useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { isEditableTarget, resolveBindings } from '../lib/shortcuts'
import { CanvasStage } from './components/CanvasStage'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ContextMenu } from './components/ContextMenu'
import type { MenuGroupDef } from './components/ContextMenu'
import { DocumentPicker } from './components/DocumentPicker'
import { EmptyCanvasHint, NoCanvases } from './components/EmptyStates'
import { PropertiesPanel } from './components/PropertiesPanel'
import { SearchOverlay } from './components/SearchOverlay'
import { TextEditorOverlay } from './components/TextEditorOverlay'
import { ToolDock } from './components/ToolDock'
import { TopBar } from './components/TopBar'
import { buildCanvasMenu } from './components/menuItems'
import type { CanvasMenuActions } from './components/menuItems'
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard'
import { useCanvasTokens } from './hooks/useCanvasTokens'
import { useElementSize } from './hooks/useElementSize'
import { useViewportController } from './hooks/useViewportController'
import { ensureActiveCanvas, hasCanvasClipboard, useActiveCanvas, useCanvasStore } from './store'
import type {
  AlignMode,
  Bounds,
  CanvasObject,
  CreationKind,
  StickyObject,
  TextObject,
  Vec,
} from './types'
import {
  screenToWorld,
  visibleWorldRect,
} from './utils/geometry'
import {
  createDocumentObject,
  createDrawObject,
  createImageObject,
  createObject,
  defaultObjectSize,
} from './utils/objects'
import { makeConnection } from './utils/connections'
import { pickImageFile } from './utils/image'
import { canvasGridDot, chrome } from './theme'
import './messages'

export function CanvasWorkspace() {
  const t = useT()
  const canvas = useActiveCanvas()
  const activeCanvasId = useCanvasStore((state) => state.activeCanvasId)
  const tool = useCanvasStore((state) => state.tool)
  const selection = useCanvasStore((state) => state.selection)
  const editingId = useCanvasStore((state) => state.editingId)
  const nodes = useStore((state) => state.nodes)
  const pushToast = useStore((state) => state.pushToast)
  const shortcutOverrides = useStore((state) => state.settings.shortcuts)
  const tokens = useCanvasTokens()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const size = useElementSize(containerRef)
  const stageRef = useRef<Konva.Stage | null>(null)
  const pointerWorldRef = useRef<Vec | null>(null)

  const {
    viewport,
    viewportRef,
    onViewportChange,
    zoomIn,
    zoomOut,
    fitToContent,
    resetZoom,
    focusObject,
  } = useViewportController(canvas, activeCanvasId, size)

  const bindings = useMemo(() => resolveBindings(shortcutOverrides), [shortcutOverrides])

  const [spaceDown, setSpaceDown] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    targetId: string | null
  } | null>(null)

  /* ----------------------- space-to-pan ---------------------------- */
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      if (isEditableTarget(event.target) || isEditableTarget(document.activeElement)) return
      if (useStore.getState().paletteOpen) return
      setSpaceDown(true)
      event.preventDefault()
    }
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceDown(false)
    }
    const reset = () => setSpaceDown(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', reset)
    }
  }, [])

  /* Repair a dangling active id left by legacy/foreign storage. */
  useEffect(() => {
    ensureActiveCanvas()
  }, [activeCanvasId])

  /* ----------------------- notes & helpers ------------------------- */
  const notes = useMemo(
    () => Object.values(nodes).filter((node) => node.kind === 'note'),
    [nodes],
  )

  const documentTitle = useCallback(
    (nodeId: string): string | null => {
      const node = nodes[nodeId]
      return node && node.kind === 'note' ? node.name : null
    },
    [nodes],
  )

  const placePoint = useCallback((): Vec => {
    if (pointerWorldRef.current) return pointerWorldRef.current
    return screenToWorld(viewportRef.current, { x: size.width / 2, y: size.height / 2 })
  }, [size.width, size.height, viewportRef])

  /* ----------------------- creation -------------------------------- */
  const createObjectAt = useCallback((kind: CreationKind, bounds: Bounds) => {
    const store = useCanvasStore.getState()
    const object = createObject(kind, bounds)
    store.addObjects([object])
    store.setTool('select')
    if (object.kind === 'sticky' || object.kind === 'text') {
      store.setEditing(object.id)
    }
  }, [])

  const addStickyAtPointer = useCallback(() => {
    const center = placePoint()
    const defaults = defaultObjectSize('sticky')
    createObjectAt('sticky', {
      x: center.x - defaults.width / 2,
      y: center.y - defaults.height / 2,
      width: defaults.width,
      height: defaults.height,
    })
  }, [createObjectAt, placePoint])

  const addDocumentCard = useCallback(
    (nodeId: string) => {
      const store = useCanvasStore.getState()
      store.addObjects([createDocumentObject(nodeId, placePoint())])
      store.setTool('select')
    },
    [placePoint],
  )

  const requestImage = useCallback(() => {
    void pickImageFile().then((asset) => {
      if (!asset) return
      const store = useCanvasStore.getState()
      const object = createImageObject(asset.src, placePoint(), {
        width: asset.width,
        height: asset.height,
      })
      store.addObjects([object])
      store.setTool('select')
    })
  }, [placePoint])

  const createDraw = useCallback((points: Vec[]) => {
    const store = useCanvasStore.getState()
    const object = createDrawObject(points)
    if (!object) return
    store.addObjects([object])
    store.setTool('select')
  }, [])

  const eraseId = useCallback((id: string) => {
    useCanvasStore.getState().deleteIds([id])
  }, [])

  /* ----------------------- text editing ---------------------------- */
  const startEditing = useCallback((object: CanvasObject) => {
    if (object.kind !== 'sticky' && object.kind !== 'text') return
    const store = useCanvasStore.getState()
    store.pushHistory('edit-text')
    store.select([object.id])
    store.setEditing(object.id)
  }, [])

  const closeEditing = useCallback(() => {
    const store = useCanvasStore.getState()
    const id = store.editingId
    if (id) {
      const active = store.canvases.find((item) => item.id === store.activeCanvasId)
      const object = active?.objects.find((item) => item.id === id)
      // An empty text object would be invisible; drop it instead of keeping a
      // ghost hit area on the board.
      if (object && object.kind === 'text' && !object.text.trim()) {
        store.deleteIds([id])
      }
    }
    store.setEditing(null)
  }, [])

  const updateEditingText = useCallback((text: string) => {
    const store = useCanvasStore.getState()
    const id = store.editingId
    if (!id) return
    store.updateObjects([{ id, patch: { text } }])
  }, [])

  const editingObject = useMemo<StickyObject | TextObject | null>(() => {
    if (!canvas || !editingId) return null
    const object = canvas.objects.find((item) => item.id === editingId)
    if (!object) return null
    return object.kind === 'sticky' || object.kind === 'text' ? object : null
  }, [canvas, editingId])

  /* ----------------------- connectors ------------------------------ */
  const [connectorFrom, setConnectorFrom] = useState<string | null>(null)
  const connectorFromRef = useRef<string | null>(null)

  const setConnector = useCallback((id: string | null) => {
    connectorFromRef.current = id
    setConnectorFrom(id)
  }, [])

  useEffect(() => {
    if (tool !== 'connector') setConnector(null)
  }, [tool, setConnector])

  useEffect(() => {
    setConnector(null)
  }, [activeCanvasId, setConnector])

  const connectorPick = useCallback(
    (objectId: string) => {
      const previous = connectorFromRef.current
      if (!previous) {
        setConnector(objectId)
        return
      }
      if (previous === objectId) {
        setConnector(null)
        return
      }
      const store = useCanvasStore.getState()
      const active = store.canvases.find((item) => item.id === store.activeCanvasId)
      const source = active?.objects.find((item) => item.id === previous)
      const target = active?.objects.find((item) => item.id === objectId)
      if (source && target) {
        store.addConnection(makeConnection(source, target))
        store.setTool('select')
      }
      setConnector(null)
    },
    [setConnector],
  )

  const connectorCancel = useCallback(() => setConnector(null), [setConnector])

  /* ----------------------- selection / live edits ------------------ */
  const pickObject = useCallback((object: CanvasObject, additive: boolean) => {
    useCanvasStore.getState().select([object.id], additive)
  }, [])

  const selectObjects = useCallback((ids: string[], additive: boolean) => {
    useCanvasStore.getState().select(ids, additive)
  }, [])

  const clearSelection = useCallback(() => {
    useCanvasStore.getState().clearSelection()
  }, [])

  const liveUpdate = useCallback(
    (updates: Array<{ id: string; patch: Record<string, unknown> }>) => {
      useCanvasStore.getState().updateObjects(updates)
    },
    [],
  )

  const bakeObjects = useCallback((objects: CanvasObject[]) => {
    useCanvasStore.getState().replaceObjects(objects)
  }, [])

  const beginHistory = useCallback((key?: string) => {
    useCanvasStore.getState().pushHistory(key)
  }, [])

  const handlePointerWorld = useCallback((point: Vec) => {
    pointerWorldRef.current = point
  }, [])

  const openDocument = useCallback((object: CanvasObject) => {
    if (object.kind !== 'document') return
    const node = useStore.getState().nodes[object.nodeId]
    if (!node || node.kind !== 'note') return
    useStore.getState().openNote(object.nodeId)
  }, [])

  const openContextMenu = useCallback(
    (targetId: string | null, x: number, y: number) => {
      setContextMenu({ targetId, x, y })
    },
    [],
  )

  /* ----------------------- canvas management ----------------------- */
  const createCanvas = useCallback(() => {
    const store = useCanvasStore.getState()
    store.createCanvas(`${t('canvas.title', 'Canvas')} ${store.canvases.length + 1}`)
    pushToast({ title: t('canvas.createdToast', 'Canvas created'), tone: 'success' })
  }, [t, pushToast])

  useEffect(() => {
    const handler = () => {
      createCanvas()
      const app = useStore.getState()
      app.setView({ kind: 'canvas' })
      app.setNav('canvas')
    }
    window.addEventListener('nexus:canvas-create', handler)
    return () => window.removeEventListener('nexus:canvas-create', handler)
  }, [createCanvas])

  const confirmDeleteCanvas = useCallback(() => {
    const store = useCanvasStore.getState()
    const removed = store.canvases.find((item) => item.id === store.activeCanvasId)?.name ?? ''
    store.deleteCanvas(store.activeCanvasId)
    setConfirmDelete(false)
    pushToast({ title: t('canvas.deletedToast', 'Canvas deleted'), message: removed, tone: 'default' })
  }, [pushToast, t])

  /* ----------------------- export ---------------------------------- */
  const exportPng = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const overlay = stage.findOne('.canvas-overlay') as Konva.Node | undefined
    const overlayVisible = overlay?.visible() ?? true
    overlay?.visible(false)
    stage.draw()
    try {
      const stageCanvas = stage.toCanvas({ pixelRatio: 2 })
      const output = document.createElement('canvas')
      output.width = stageCanvas.width
      output.height = stageCanvas.height
      const context = output.getContext('2d')
      if (!context) return
      context.fillStyle = tokens.bgMain
      context.fillRect(0, 0, output.width, output.height)
      context.drawImage(stageCanvas, 0, 0)
      const link = document.createElement('a')
      const name = (canvas?.name ?? 'canvas').replace(/[\\/:*?"<>|]+/g, '-')
      link.download = `${name}.png`
      link.href = output.toDataURL('image/png')
      link.click()
      pushToast({ title: t('canvas.exportedToast', 'PNG exported'), tone: 'success' })
    } finally {
      overlay?.visible(overlayVisible)
      stage.draw()
    }
  }, [canvas, tokens.bgMain, t, pushToast])

  /* ----------------------- menu & keyboard ------------------------- */
  const alignSelection = useCallback(
    (mode: AlignMode) => {
      useCanvasStore.getState().align(mode, visibleWorldRect(viewportRef.current, size))
    },
    [size, viewportRef],
  )

  const menuGroups = useMemo<MenuGroupDef[]>(() => {
    if (!contextMenu || !canvas) return []
    const actions: CanvasMenuActions = {
      duplicate: () => useCanvasStore.getState().duplicateSelection(),
      copy: () => useCanvasStore.getState().copySelection(),
      paste: () => useCanvasStore.getState().paste(),
      deleteSelection: () => useCanvasStore.getState().deleteSelection(),
      deleteId: (id) => useCanvasStore.getState().deleteIds([id]),
      group: () => useCanvasStore.getState().groupSelection(),
      ungroup: () => useCanvasStore.getState().ungroupSelection(),
      bringFront: () => useCanvasStore.getState().zOrder('front'),
      sendBack: () => useCanvasStore.getState().zOrder('back'),
      align: alignSelection,
      selectAll: () => useCanvasStore.getState().selectAll(),
      addSticky: addStickyAtPointer,
      addDocument: () => setDocumentPickerOpen(true),
      fit: fitToContent,
      resetZoom,
      exportPng,
      newCanvas: createCanvas,
      openDocument: (nodeId) => useStore.getState().openNote(nodeId),
      updateConnection: (id, patch) =>
        useCanvasStore.getState().updateConnection(id, patch, { history: true }),
    }
    return buildCanvasMenu({
      t,
      canvas,
      selection,
      targetId: contextMenu.targetId,
      bindings,
      clipboardAvailable: hasCanvasClipboard(),
      documentTitle,
      actions,
    })
  }, [
    contextMenu,
    canvas,
    selection,
    t,
    bindings,
    documentTitle,
    alignSelection,
    addStickyAtPointer,
    fitToContent,
    resetZoom,
    exportPng,
    createCanvas,
  ])

  const closeOverlay = useCallback((): boolean => {
    if (contextMenu) {
      setContextMenu(null)
      return true
    }
    if (confirmDelete) {
      setConfirmDelete(false)
      return true
    }
    if (searchOpen) {
      setSearchOpen(false)
      return true
    }
    if (documentPickerOpen) {
      setDocumentPickerOpen(false)
      return true
    }
    if (connectorFromRef.current) {
      setConnector(null)
      return true
    }
    return false
  }, [contextMenu, confirmDelete, searchOpen, documentPickerOpen, setConnector])

  const nudge = useCallback((dx: number, dy: number) => {
    const store = useCanvasStore.getState()
    const active = store.canvases.find((item) => item.id === store.activeCanvasId)
    if (!active) return
    const updates = active.objects
      .filter((object) => store.selection.includes(object.id))
      .map((object) => ({ id: object.id, patch: { x: object.x + dx, y: object.y + dy } }))
    if (updates.length) store.updateObjects(updates, { history: true, key: 'nudge' })
  }, [])

  const keyboardHandlers = useMemo(
    () => ({
      fitToContent,
      resetZoom,
      openSearch: () => setSearchOpen(true),
      openDocumentPicker: () => setDocumentPickerOpen(true),
      requestImage,
      closeOverlay,
      nudge,
    }),
    [fitToContent, resetZoom, requestImage, closeOverlay, nudge],
  )

  useCanvasKeyboard(Boolean(canvas), keyboardHandlers)

  /* ----------------------- render ---------------------------------- */
  const showGrid = viewport.scale > 0.3
  const gridSize = Math.max(8, 24 * viewport.scale)
  const gridStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: showGrid
      ? `radial-gradient(circle, ${canvasGridDot} 1px, transparent 1px)`
      : 'none',
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
  }

  const canvasName = canvas?.name ?? ''
  const confirmTitle = t('canvas.confirmDeleteTitle', 'Delete canvas "{name}"?').replace(
    '{name}',
    canvasName,
  )

  return (
    <div
      className="relative flex h-full w-full min-h-0 flex-col"
      style={{ background: chrome.main }}
    >
      <TopBar
        viewport={viewport}
        onCreateCanvas={createCanvas}
        onRequestDeleteCanvas={() => setConfirmDelete(true)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fitToContent}
        onResetZoom={resetZoom}
        onSearch={() => setSearchOpen(true)}
        onExport={exportPng}
      />

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          background: chrome.main,
        }}
      >
        {canvas ? (
          <>
            <div style={gridStyle} />
            <div style={{ position: 'absolute', inset: 0 }}>
              <CanvasStage
                canvas={canvas}
                viewport={viewport}
                size={size}
                tool={tool}
                selection={selection}
                editingId={editingId}
                tokens={tokens}
                spaceDown={spaceDown}
                connectorFrom={connectorFrom}
                stageRef={stageRef}
                documentTitle={documentTitle}
                onViewportChange={onViewportChange}
                onSelectObjects={selectObjects}
                onClearSelection={clearSelection}
                onPickObject={pickObject}
                onOpenDocument={openDocument}
                onEditObject={startEditing}
                onEraseId={eraseId}
                onConnectorPick={connectorPick}
                onConnectorCancel={connectorCancel}
                onContextMenu={openContextMenu}
                onBeginHistory={beginHistory}
                onLiveUpdate={liveUpdate}
                onBakeObjects={bakeObjects}
                onCreateObject={createObjectAt}
                onCreateDraw={createDraw}
                onPointerWorld={handlePointerWorld}
              />
            </div>
            <ToolDock
              onImage={requestImage}
              onDocument={() => setDocumentPickerOpen(true)}
            />
            <PropertiesPanel viewport={viewport} size={size} />
            {canvas.objects.length === 0 && (
              <EmptyCanvasHint
                onAddSticky={addStickyAtPointer}
                onAddDocument={() => setDocumentPickerOpen(true)}
              />
            )}
            {editingObject && (
              <TextEditorOverlay
                object={editingObject}
                viewport={viewport}
                onChange={updateEditingText}
                onClose={closeEditing}
              />
            )}
            {contextMenu && menuGroups.length > 0 && (
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                groups={menuGroups}
                onClose={() => setContextMenu(null)}
              />
            )}
            <SearchOverlay
              open={searchOpen}
              objects={canvas.objects}
              documentTitle={documentTitle}
              onClose={() => setSearchOpen(false)}
              onPick={focusObject}
              t={t}
            />
            <DocumentPicker
              open={documentPickerOpen}
              notes={notes}
              onClose={() => setDocumentPickerOpen(false)}
              onPick={addDocumentCard}
              t={t}
            />
          </>
        ) : (
          <NoCanvases onCreate={createCanvas} />
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={confirmTitle}
        message={t(
          'canvas.confirmDeleteBody',
          'All objects and connectors on this canvas will be removed. This cannot be undone.',
        )}
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onConfirm={confirmDeleteCanvas}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
