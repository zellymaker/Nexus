/**
 * A single canvas object as a draggable / selectable Konva group.
 *
 * The group id equals the model object id, which is how the stage maps Konva
 * nodes back to objects (selection, transformer, eraser hit-testing).
 */
import { Group, Rect } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { CanvasObject, Tool } from '../types'
import type { CanvasTokens } from '../hooks/useCanvasTokens'
import { ObjectBody } from './ObjectBody'

export interface ObjectShapeProps {
  object: CanvasObject
  tool: Tool
  editing: boolean
  tokens: CanvasTokens
  /** Resolved note title for document cards; `null` = deleted document. */
  documentTitle: string | null
  onMouseDown: (event: KonvaEventObject<MouseEvent>) => void
  onClick: (event: KonvaEventObject<MouseEvent>) => void
  onDblClick: (event: KonvaEventObject<MouseEvent>) => void
  onContextMenu: (event: KonvaEventObject<PointerEvent>) => void
  onDragStart: (event: KonvaEventObject<DragEvent>) => void
  onDragMove: (event: KonvaEventObject<DragEvent>) => void
  onDragEnd: (event: KonvaEventObject<DragEvent>) => void
  onRemoveDocument: () => void
}

export function ObjectShape({
  object,
  tool,
  editing,
  tokens,
  documentTitle,
  onMouseDown,
  onClick,
  onDblClick,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
  onRemoveDocument,
}: ObjectShapeProps) {
  const interactive = tool === 'select' || tool === 'connector' || tool === 'eraser'
  return (
    <Group
      id={object.id}
      name="canvas-object"
      x={object.x}
      y={object.y}
      rotation={object.rotation}
      opacity={object.opacity}
      draggable={tool === 'select'}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDblClick={onDblClick}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={(event) => {
        if (!interactive) return
        const stage = event.target.getStage()
        if (stage) stage.container().style.cursor = tool === 'select' ? 'move' : 'crosshair'
      }}
      onMouseLeave={(event) => {
        const stage = event.target.getStage()
        if (stage) stage.container().style.cursor = ''
      }}
    >
      <ObjectBody
        object={object}
        tokens={tokens}
        editing={editing}
        documentTitle={documentTitle}
        onRemoveDocument={onRemoveDocument}
      />
      {/* Invisible hit area so text/ink objects are easy to grab. Document
          cards keep their own hit target (background rect + remove button). */}
      {object.kind !== 'document' && (
        <Rect width={object.width} height={object.height} fill="rgba(0, 0, 0, 0.001)" />
      )}
    </Group>
  )
}
