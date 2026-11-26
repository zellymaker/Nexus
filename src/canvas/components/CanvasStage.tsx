/**
 * The Konva stage: infinite board surface with pan / zoom, object + connector
 * rendering, marquee selection, transformer gestures, creation drags, free
 * draw, eraser and the connector preview.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Arrow, Layer, Line, Rect, Stage, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { RefObject } from 'react'
import type {
  Bounds,
  CanvasDoc,
  CanvasObject,
  CreationKind,
  Tool,
  Vec,
  Viewport,
} from '../types'
import type { CanvasTokens } from '../hooks/useCanvasTokens'
import { DEFAULT_DRAW_STROKE, DEFAULT_DRAW_WIDTH } from '../palette'
import {
  anchorPoint,
  anchorSideTowards,
  clampViewport,
  normalizeRect,
  objectBounds,
  rectsIntersect,
  screenToWorld,
  zoomAt,
} from '../utils/geometry'
import { bakeObjectTransform, defaultObjectSize } from '../utils/objects'
import { ConnectionsLayer } from './ConnectionsLayer'
import { ObjectShape } from './ObjectShape'

export interface CanvasStageProps {
  canvas: CanvasDoc
  viewport: Viewport
  size: { width: number; height: number }
  tool: Tool
  selection: string[]
  editingId: string | null
  tokens: CanvasTokens
  spaceDown: boolean
  connectorFrom: string | null
  stageRef: RefObject<Konva.Stage | null>
  documentTitle: (nodeId: string) => string | null
  onViewportChange: (viewport: Viewport) => void
  onSelectObjects: (ids: string[], additive: boolean) => void
  onClearSelection: () => void
  onPickObject: (object: CanvasObject, additive: boolean) => void
  onOpenDocument: (object: CanvasObject) => void
  onEditObject: (object: CanvasObject) => void
  onEraseId: (id: string) => void
  onConnectorPick: (objectId: string) => void
  onConnectorCancel: () => void
  onContextMenu: (targetId: string | null, clientX: number, clientY: number) => void
  onBeginHistory: (coalesceKey?: string) => void
  onLiveUpdate: (updates: Array<{ id: string; patch: Record<string, unknown> }>) => void
  onBakeObjects: (objects: CanvasObject[]) => void
  onCreateObject: (kind: CreationKind, bounds: Bounds) => void
  onCreateDraw: (points: Vec[]) => void
  onPointerWorld: (point: Vec) => void
}

type CreationTool = CreationKind

const CREATION_TOOLS: CreationTool[] = ['sticky', 'text', 'rect', 'ellipse']

const isCreationTool = (tool: Tool): tool is CreationTool =>
  (CREATION_TOOLS as Tool[]).includes(tool)

type Interaction =
  | { kind: 'pan'; startClient: Vec; startViewport: Viewport }
  | {
      kind: 'marquee'
      startWorld: Vec
      startClient: Vec
      additive: boolean
      moved: boolean
      rect: Bounds | null
    }
  | {
      kind: 'create'
      creationTool: CreationTool
      startWorld: Vec
      startClient: Vec
      moved: boolean
      rect: Bounds | null
    }
  | { kind: 'draw'; points: Vec[] }
  | { kind: 'erase'; startClient: Vec }

export function CanvasStage(props: CanvasStageProps) {
  const {
    canvas,
    viewport,
    size,
    tool,
    selection,
    editingId,
    tokens,
    spaceDown,
    connectorFrom,
    stageRef,
    onSelectObjects,
    onEraseId,
    onContextMenu,
    documentTitle,
  } = props

  const propsRef = useRef(props)
  propsRef.current = props

  const trRef = useRef<Konva.Transformer | null>(null)
  const interactionRef = useRef<Interaction | null>(null)
  const dragFrameRef = useRef<number | null>(null)
  const dragMovedRef = useRef(false)
  const dragIdRef = useRef<string | null>(null)

  const [marquee, setMarquee] = useState<Bounds | null>(null)
  const [creationRect, setCreationRect] = useState<Bounds | null>(null)
  const [drawPoints, setDrawPoints] = useState<Vec[] | null>(null)
  const [connectorPreview, setConnectorPreview] = useState<{ from: Vec; to: Vec } | null>(null)
  const [panning, setPanning] = useState(false)

  /* ----------------------- coordinate helpers ---------------------- */

  const clientToStage = useCallback(
    (clientX: number, clientY: number): Vec | null => {
      const stage = stageRef.current
      if (!stage) return null
      const rect = stage.container().getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    },
    [stageRef],
  )

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): Vec | null => {
      const point = clientToStage(clientX, clientY)
      if (!point) return null
      return screenToWorld(propsRef.current.viewport, point)
    },
    [clientToStage],
  )

  const resolveId = useCallback(
    (node: Konva.Node | null | undefined): string | null => {
      if (!node) return null
      const state = propsRef.current
      const objectIds = new Set(state.canvas.objects.map((object) => object.id))
      const connectionIds = new Set(state.canvas.connections.map((connection) => connection.id))
      let current: Konva.Node | null = node
      for (let guard = 0; guard < 12 && current; guard += 1) {
        const id = current.id()
        if (id && (objectIds.has(id) || connectionIds.has(id))) return id
        if (current === stageRef.current) break
        current = current.getParent()
      }
      return null
    },
    [stageRef],
  )

  const eraseAt = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current
      const point = clientToStage(clientX, clientY)
      if (!stage || !point) return
      const id = resolveId(stage.getIntersection(point))
      if (id) propsRef.current.onEraseId(id)
    },
    [clientToStage, resolveId, stageRef],
  )

  const flushDragPositions = useCallback(
    (extraId?: string | null) => {
      const stage = stageRef.current
      if (!stage) return
      const state = propsRef.current
      const ids = new Set(state.selection)
      if (extraId) ids.add(extraId)
      const updates: Array<{ id: string; patch: Record<string, unknown> }> = []
      for (const id of ids) {
        const node = stage.findOne(`#${id}`)
        if (!node) continue
        updates.push({ id, patch: { x: node.x(), y: node.y() } })
      }
      if (updates.length) state.onLiveUpdate(updates)
    },
    [stageRef],
  )

  const scheduleDragFlush = useCallback(
    (extraId?: string | null) => {
      if (dragFrameRef.current !== null) return
      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null
        flushDragPositions(extraId)
      })
    },
    [flushDragPositions],
  )

  /* ----------------------- pointer interactions -------------------- */

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const state = propsRef.current
      const world = clientToWorld(event.clientX, event.clientY)
      if (world) state.onPointerWorld(world)

      if (state.tool === 'connector') {
        const source = state.connectorFrom
          ? state.canvas.objects.find((object) => object.id === state.connectorFrom)
          : undefined
        if (source && world) {
          const side = anchorSideTowards(source, world)
          setConnectorPreview({ from: anchorPoint(source, side), to: world })
        } else {
          setConnectorPreview((previous) => (previous ? null : previous))
        }
      } else {
        setConnectorPreview((previous) => (previous ? null : previous))
      }

      const interaction = interactionRef.current
      if (!interaction) return

      switch (interaction.kind) {
        case 'pan': {
          state.onViewportChange({
            x: interaction.startViewport.x + (event.clientX - interaction.startClient.x),
            y: interaction.startViewport.y + (event.clientY - interaction.startClient.y),
            scale: interaction.startViewport.scale,
          })
          return
        }
        case 'marquee': {
          const point = world ?? interaction.startWorld
          const distance =
            Math.abs(event.clientX - interaction.startClient.x) +
            Math.abs(event.clientY - interaction.startClient.y)
          if (distance > 3) interaction.moved = true
          interaction.rect = normalizeRect(interaction.startWorld, point)
          setMarquee(interaction.moved ? interaction.rect : null)
          return
        }
        case 'create': {
          const point = world ?? interaction.startWorld
          const distance =
            Math.abs(event.clientX - interaction.startClient.x) +
            Math.abs(event.clientY - interaction.startClient.y)
          if (distance > 3) interaction.moved = true
          interaction.rect = normalizeRect(interaction.startWorld, point)
          setCreationRect(interaction.moved ? interaction.rect : null)
          return
        }
        case 'draw': {
          if (!world) return
          const last = interaction.points[interaction.points.length - 1]
          const minDistance = 2 / state.viewport.scale
          if (!last || Math.hypot(world.x - last.x, world.y - last.y) >= minDistance) {
            interaction.points.push(world)
            setDrawPoints([...interaction.points])
          }
          return
        }
        case 'erase': {
          eraseAt(event.clientX, event.clientY)
          return
        }
      }
    }

    const handlePointerUp = () => {
      const interaction = interactionRef.current
      interactionRef.current = null
      setPanning(false)
      if (!interaction) return
      const state = propsRef.current

      switch (interaction.kind) {
        case 'pan':
          return
        case 'marquee': {
          setMarquee(null)
          if (interaction.moved && interaction.rect) {
            const rect = interaction.rect
            const ids = state.canvas.objects
              .filter((object) => rectsIntersect(objectBounds(object), rect))
              .map((object) => object.id)
            if (ids.length) state.onSelectObjects(ids, interaction.additive)
            else if (!interaction.additive) state.onClearSelection()
          } else if (!interaction.additive) {
            state.onClearSelection()
          }
          return
        }
        case 'create': {
          setCreationRect(null)
          if (interaction.moved && interaction.rect) {
            const rect = interaction.rect
            state.onCreateObject(interaction.creationTool, {
              x: rect.x,
              y: rect.y,
              width: Math.max(48, rect.width),
              height: Math.max(48, rect.height),
            })
          } else {
            const defaults = defaultObjectSize(interaction.creationTool)
            state.onCreateObject(interaction.creationTool, {
              x: interaction.startWorld.x - defaults.width / 2,
              y: interaction.startWorld.y - defaults.height / 2,
              width: defaults.width,
              height: defaults.height,
            })
          }
          return
        }
        case 'draw': {
          setDrawPoints(null)
          if (interaction.points.length >= 2) state.onCreateDraw(interaction.points)
          return
        }
        case 'erase':
          return
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [clientToWorld, eraseAt])

  useEffect(
    () => () => {
      if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current)
    },
    [],
  )

  /* ----------------------- stage events ---------------------------- */

  const handleStageMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    const state = propsRef.current
    const native = event.evt
    const targetIsStage = event.target === event.target.getStage()

    if (native.button === 1 || state.tool === 'hand' || state.spaceDown) {
      native.preventDefault()
      setPanning(true)
      interactionRef.current = {
        kind: 'pan',
        startClient: { x: native.clientX, y: native.clientY },
        startViewport: state.viewport,
      }
      return
    }
    if (native.button !== 0) return

    const currentTool = state.tool
    if (
      !targetIsStage &&
      !isCreationTool(currentTool) &&
      currentTool !== 'draw' &&
      currentTool !== 'eraser' &&
      currentTool !== 'connector'
    ) {
      return
    }

    const world = clientToWorld(native.clientX, native.clientY)
    if (!world) return

    if (currentTool === 'select') {
      if (!targetIsStage) return
      interactionRef.current = {
        kind: 'marquee',
        startWorld: world,
        startClient: { x: native.clientX, y: native.clientY },
        additive: native.shiftKey,
        moved: false,
        rect: null,
      }
      return
    }
    if (currentTool === 'draw') {
      interactionRef.current = { kind: 'draw', points: [world] }
      setDrawPoints([world])
      return
    }
    if (currentTool === 'eraser') {
      interactionRef.current = {
        kind: 'erase',
        startClient: { x: native.clientX, y: native.clientY },
      }
      eraseAt(native.clientX, native.clientY)
      return
    }
    if (isCreationTool(currentTool)) {
      interactionRef.current = {
        kind: 'create',
        creationTool: currentTool,
        startWorld: world,
        startClient: { x: native.clientX, y: native.clientY },
        moved: false,
        rect: null,
      }
      return
    }
    if (currentTool === 'connector') {
      // Only an empty-canvas click cancels a pending connector; clicks on
      // objects arrive as `click` (after mouseup) and pick the target.
      if (targetIsStage) state.onConnectorCancel()
    }
  }

  const handleStageWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const state = propsRef.current
    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()
    if (!stage || !pointer) return
    if (event.evt.ctrlKey || event.evt.metaKey) {
      const factor = Math.exp(-event.evt.deltaY * 0.0016)
      state.onViewportChange(
        clampViewport(zoomAt(state.viewport, state.viewport.scale * factor, pointer)),
      )
      return
    }
    const horizontal = event.evt.shiftKey && event.evt.deltaX === 0
    const dx = horizontal ? event.evt.deltaY : event.evt.deltaX
    const dy = horizontal ? 0 : event.evt.deltaY
    state.onViewportChange({
      x: state.viewport.x - dx,
      y: state.viewport.y - dy,
      scale: state.viewport.scale,
    })
  }

  const handleStageContextMenu = (event: KonvaEventObject<PointerEvent>) => {
    if (event.target !== event.target.getStage()) return
    event.evt.preventDefault()
    propsRef.current.onContextMenu(null, event.evt.clientX, event.evt.clientY)
  }

  /* ----------------------- object events --------------------------- */

  const handleObjectMouseDown = (object: CanvasObject, event: KonvaEventObject<MouseEvent>) => {
    const state = propsRef.current
    if (event.evt.button !== 0) return
    if (state.spaceDown) return
    if (state.tool !== 'select') return
    event.cancelBubble = true
    if (!state.selection.includes(object.id) && !event.evt.shiftKey) {
      state.onPickObject(object, false)
    }
  }

  const handleObjectClick = (object: CanvasObject, event: KonvaEventObject<MouseEvent>) => {
    const state = propsRef.current
    if (state.tool === 'eraser') {
      state.onEraseId(object.id)
      return
    }
    if (state.tool === 'connector') {
      state.onConnectorPick(object.id)
      return
    }
    if (state.tool !== 'select') return
    if (dragMovedRef.current) {
      dragMovedRef.current = false
      return
    }
    const additive = event.evt.shiftKey
    state.onPickObject(object, additive)
    if (object.kind === 'document' && !additive) state.onOpenDocument(object)
  }

  const handleObjectDblClick = (object: CanvasObject) => {
    const state = propsRef.current
    if (state.tool !== 'select') return
    if (object.kind === 'sticky' || object.kind === 'text') state.onEditObject(object)
  }

  const handleObjectContextMenu = (
    object: CanvasObject,
    event: KonvaEventObject<PointerEvent>,
  ) => {
    const state = propsRef.current
    event.evt.preventDefault()
    event.cancelBubble = true
    if (!state.selection.includes(object.id)) state.onPickObject(object, false)
    state.onContextMenu(object.id, event.evt.clientX, event.evt.clientY)
  }

  const handleObjectDragStart = (object: CanvasObject, event: KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true
    const state = propsRef.current
    if (state.tool !== 'select') return
    if (!state.selection.includes(object.id)) state.onPickObject(object, false)
    state.onBeginHistory('move')
    dragMovedRef.current = false
    dragIdRef.current = object.id
  }

  const handleObjectDragMove = (object: CanvasObject) => {
    dragMovedRef.current = true
    scheduleDragFlush(dragIdRef.current ?? object.id)
  }

  const handleObjectDragEnd = () => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current)
      dragFrameRef.current = null
    }
    flushDragPositions(dragIdRef.current)
    // Konva may or may not fire a click after a drag; clear the guard on the
    // next macrotask so the following click is handled normally.
    window.setTimeout(() => {
      dragMovedRef.current = false
    }, 0)
  }

  const handleTransformEnd = useCallback(() => {
    const transformer = trRef.current
    if (!transformer) return
    const state = propsRef.current
    const baked: CanvasObject[] = []
    for (const node of transformer.nodes()) {
      const object = state.canvas.objects.find((item) => item.id === node.id())
      if (!object) continue
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      baked.push(
        bakeObjectTransform(object, {
          x: node.x(),
          y: node.y(),
          scaleX,
          scaleY,
          rotation: node.rotation(),
        }),
      )
      node.scaleX(1)
      node.scaleY(1)
    }
    if (baked.length) state.onBakeObjects(baked)
  }, [])

  /* ----------------------- transformer attachment ------------------ */

  const selectionKey = selection.join('|')
  const objectIdsKey = canvas.objects.map((object) => object.id).join('|')

  useEffect(() => {
    const transformer = trRef.current
    const stage = stageRef.current
    if (!transformer || !stage) return
    const state = propsRef.current
    const nodes: Konva.Node[] = []
    for (const object of state.canvas.objects) {
      if (!state.selection.includes(object.id)) continue
      const node = stage.findOne(`#${object.id}`)
      if (node) nodes.push(node)
    }
    transformer.nodes(nodes)
    transformer.getLayer()?.batchDraw()
  }, [selectionKey, objectIdsKey, stageRef])

  /* ----------------------- render ---------------------------------- */

  if (size.width < 2 || size.height < 2) return null

  const scale = viewport.scale
  const hairlines = 1 / scale
  const connectorSource = connectorFrom
    ? canvas.objects.find((object) => object.id === connectorFrom)
    : undefined
  const connectorSourceBounds = connectorSource ? objectBounds(connectorSource) : null
  const cursor = panning
    ? 'grabbing'
    : spaceDown || tool === 'hand'
      ? 'grab'
      : tool === 'select'
        ? 'default'
        : tool === 'eraser'
          ? 'cell'
          : 'crosshair'

  return (
    <Stage
      ref={stageRef}
      width={size.width}
      height={size.height}
      x={viewport.x}
      y={viewport.y}
      scaleX={scale}
      scaleY={scale}
      style={{ cursor }}
      onWheel={handleStageWheel}
      onMouseDown={handleStageMouseDown}
      onContextMenu={handleStageContextMenu}
    >
      <Layer>
        <ConnectionsLayer
          connections={canvas.connections}
          objects={canvas.objects}
          selection={selection}
          tokens={tokens}
          onSelect={(id, additive) => onSelectObjects([id], additive)}
          onContextMenu={onContextMenu}
        />
      </Layer>

      <Layer>
        {canvas.objects.map((object) => (
          <ObjectShape
            key={object.id}
            object={object}
            tool={tool}
            editing={editingId === object.id}
            tokens={tokens}
            documentTitle={object.kind === 'document' ? documentTitle(object.nodeId) : null}
            onMouseDown={(event) => handleObjectMouseDown(object, event)}
            onClick={(event) => handleObjectClick(object, event)}
            onDblClick={() => handleObjectDblClick(object)}
            onContextMenu={(event) => handleObjectContextMenu(object, event)}
            onDragStart={(event) => handleObjectDragStart(object, event)}
            onDragMove={() => handleObjectDragMove(object)}
            onDragEnd={handleObjectDragEnd}
            onRemoveDocument={() => onEraseId(object.id)}
          />
        ))}
      </Layer>

      <Layer name="canvas-overlay">
        {connectorSourceBounds && (
          <Rect
            x={connectorSourceBounds.x - 4}
            y={connectorSourceBounds.y - 4}
            width={connectorSourceBounds.width + 8}
            height={connectorSourceBounds.height + 8}
            stroke={tokens.accent}
            strokeWidth={1.5 * hairlines}
            dash={[5 * hairlines, 4 * hairlines]}
            cornerRadius={6}
            listening={false}
          />
        )}
        {marquee && (
          <Rect
            x={marquee.x}
            y={marquee.y}
            width={marquee.width}
            height={marquee.height}
            fill="rgba(135, 127, 254, 0.10)"
            stroke={tokens.accent}
            strokeWidth={hairlines}
            dash={[4 * hairlines, 3 * hairlines]}
            listening={false}
          />
        )}
        {creationRect && (
          <Rect
            x={creationRect.x}
            y={creationRect.y}
            width={creationRect.width}
            height={creationRect.height}
            fill="rgba(135, 127, 254, 0.08)"
            stroke={tokens.accent}
            strokeWidth={1.5 * hairlines}
            dash={[5 * hairlines, 4 * hairlines]}
            listening={false}
          />
        )}
        {drawPoints && drawPoints.length > 1 && (
          <Line
            points={drawPoints.flatMap((point) => [point.x, point.y])}
            stroke={DEFAULT_DRAW_STROKE}
            strokeWidth={DEFAULT_DRAW_WIDTH}
            lineCap="round"
            lineJoin="round"
            tension={0.35}
            listening={false}
          />
        )}
        {connectorPreview && (
          <Arrow
            points={[
              connectorPreview.from.x,
              connectorPreview.from.y,
              connectorPreview.to.x,
              connectorPreview.to.y,
            ]}
            stroke={tokens.accent}
            fill={tokens.accent}
            strokeWidth={1.6}
            dash={[6 * hairlines, 4 * hairlines]}
            pointerLength={9}
            pointerWidth={8}
            listening={false}
          />
        )}
        <Transformer
          ref={trRef}
          rotateEnabled
          rotateAnchorOffset={26}
          keepRatio={false}
          flipEnabled={false}
          ignoreStroke
          padding={4}
          borderStroke={tokens.accent}
          borderStrokeWidth={1.5}
          borderDash={[3, 3]}
          anchorStroke={tokens.accent}
          anchorFill={tokens.surface}
          anchorSize={8}
          anchorCornerRadius={4}
          boundBoxFunc={(oldBox, newBox) =>
            Math.abs(newBox.width) < 24 || Math.abs(newBox.height) < 24 ? oldBox : newBox
          }
          onTransformStart={() => propsRef.current.onBeginHistory('transform')}
          onTransformEnd={handleTransformEnd}
        />
      </Layer>
    </Stage>
  )
}
