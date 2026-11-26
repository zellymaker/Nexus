/**
 * Factories and transforms for canvas objects.
 */
import type {
  Bounds,
  CanvasObject,
  Connection,
  CreationKind,
  ObjectKind,
  Vec,
} from '../types'
import {
  DEFAULT_DRAW_STROKE,
  DEFAULT_DRAW_WIDTH,
  DEFAULT_SHAPE_FILL,
  DEFAULT_STICKY_FILL,
  DEFAULT_STROKE,
  DEFAULT_TEXT_COLOR,
  STICKY_TEXT_COLOR,
} from '../palette'
import { clamp } from './geometry'

export const MIN_OBJECT_SIZE = 24

export const uid = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export const defaultObjectSize = (kind: CreationKind | 'document'): { width: number; height: number } => {
  switch (kind) {
    case 'sticky':
      return { width: 220, height: 150 }
    case 'text':
      return { width: 300, height: 44 }
    case 'document':
      return { width: 268, height: 92 }
    default:
      return { width: 180, height: 130 }
  }
}

const baseProps = (bounds: Bounds) => ({
  x: Math.round(bounds.x),
  y: Math.round(bounds.y),
  width: Math.max(MIN_OBJECT_SIZE, Math.round(bounds.width)),
  height: Math.max(MIN_OBJECT_SIZE, Math.round(bounds.height)),
  rotation: 0,
  opacity: 1,
  groupId: null,
})

export function createObject(kind: CreationKind, bounds: Bounds): CanvasObject {
  const base = { ...baseProps(bounds), id: uid() }
  switch (kind) {
    case 'sticky':
      return {
        ...base,
        kind: 'sticky',
        text: '',
        fill: DEFAULT_STICKY_FILL,
        textColor: STICKY_TEXT_COLOR,
        fontSize: 15,
      }
    case 'text':
      return {
        ...base,
        kind: 'text',
        text: '',
        color: DEFAULT_TEXT_COLOR,
        fontSize: 22,
        bold: false,
        align: 'left',
      }
    case 'ellipse':
      return {
        ...base,
        kind: 'ellipse',
        fill: DEFAULT_SHAPE_FILL,
        stroke: DEFAULT_STROKE,
        strokeWidth: 1.5,
      }
    default:
      return {
        ...base,
        kind: 'rect',
        fill: DEFAULT_SHAPE_FILL,
        stroke: DEFAULT_STROKE,
        strokeWidth: 1.5,
      }
  }
}

export function createDocumentObject(
  nodeId: string,
  center: Vec,
  size: { width: number; height: number } = defaultObjectSize('document'),
): CanvasObject {
  return {
    ...baseProps({
      x: center.x - size.width / 2,
      y: center.y - size.height / 2,
      width: size.width,
      height: size.height,
    }),
    id: uid(),
    kind: 'document',
    nodeId,
  }
}

export function createImageObject(
  src: string,
  center: Vec,
  natural: { width: number; height: number },
  maxEdge = 420,
): CanvasObject {
  const ratio =
    natural.width > 0 && natural.height > 0
      ? Math.min(1, maxEdge / natural.width, maxEdge / natural.height)
      : 1
  const width = Math.max(MIN_OBJECT_SIZE, Math.round((natural.width || 320) * ratio))
  const height = Math.max(MIN_OBJECT_SIZE, Math.round((natural.height || 220) * ratio))
  return {
    ...baseProps({
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
    }),
    id: uid(),
    kind: 'image',
    src,
  }
}

export function createDrawObject(
  points: Vec[],
  stroke = DEFAULT_DRAW_STROKE,
  strokeWidth = DEFAULT_DRAW_WIDTH,
): CanvasObject | null {
  if (points.length < 2) return null
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const width = Math.max(MIN_OBJECT_SIZE, Math.max(...xs) - minX)
  const height = Math.max(MIN_OBJECT_SIZE, Math.max(...ys) - minY)
  const flat: number[] = []
  for (const point of points) {
    flat.push(point.x - minX, point.y - minY)
  }
  return {
    ...baseProps({ x: minX, y: minY, width, height }),
    id: uid(),
    kind: 'draw',
    points: flat,
    stroke,
    strokeWidth,
  }
}

/** Deep-enough copy for undo snapshots (keeps the id). */
export function copyObjectData(object: CanvasObject): CanvasObject {
  return object.kind === 'draw' ? { ...object, points: [...object.points] } : { ...object }
}

export function duplicateObject(object: CanvasObject, offset = 24): CanvasObject {
  return {
    ...copyObjectData(object),
    id: uid(),
    x: object.x + offset,
    y: object.y + offset,
    groupId: null,
  }
}

export function copyConnection(connection: Connection): Connection {
  return { ...connection, from: { ...connection.from }, to: { ...connection.to } }
}

export interface TransformData {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

const clampFont = (size: number): number => Math.round(clamp(size, 9, 160))

/**
 * Bake a Konva.Transformer gesture (x/y/scale/rotation on a node) back into
 * the plain-data object so the model stays canonical.
 */
export function bakeObjectTransform(
  object: CanvasObject,
  transform: TransformData,
): CanvasObject {
  const width = Math.max(MIN_OBJECT_SIZE, Math.round(object.width * Math.abs(transform.scaleX)))
  const height = Math.max(MIN_OBJECT_SIZE, Math.round(object.height * Math.abs(transform.scaleY)))
  const common = {
    x: Math.round(transform.x),
    y: Math.round(transform.y),
    width,
    height,
    rotation: Math.round(transform.rotation * 10) / 10,
  }
  switch (object.kind) {
    case 'draw': {
      const scaleX = width / object.width
      const scaleY = height / object.height
      return {
        ...object,
        ...common,
        points: object.points.map((value, index) =>
          Math.round(index % 2 === 0 ? value * scaleX : value * scaleY),
        ),
      }
    }
    case 'sticky': {
      const factor = (Math.abs(transform.scaleX) + Math.abs(transform.scaleY)) / 2
      return { ...object, ...common, fontSize: clampFont(object.fontSize * factor) }
    }
    case 'text': {
      const factor = (Math.abs(transform.scaleX) + Math.abs(transform.scaleY)) / 2
      return { ...object, ...common, fontSize: clampFont(object.fontSize * factor) }
    }
    default:
      return { ...object, ...common }
  }
}

/** All ids of the group containing any of `ids` (plus the ids themselves). */
export function expandGroupIds(objects: CanvasObject[], ids: string[]): string[] {
  const byId = new Map(objects.map((object) => [object.id, object]))
  const groupIds = new Set<string>()
  for (const id of ids) {
    const object = byId.get(id)
    if (object?.groupId) groupIds.add(object.groupId)
  }
  if (!groupIds.size) return [...new Set(ids)]
  const result = new Set(ids)
  for (const object of objects) {
    if (object.groupId && groupIds.has(object.groupId)) result.add(object.id)
  }
  return [...result]
}

export function objectSearchText(object: CanvasObject): string {
  if (object.kind === 'sticky' || object.kind === 'text') return object.text
  return ''
}

/** i18n key describing the object type, used by the properties panel. */
export function objectTypeKey(kind: ObjectKind): string {
  switch (kind) {
    case 'sticky':
      return 'canvas.tools.sticky'
    case 'text':
      return 'canvas.tools.text'
    case 'rect':
    case 'ellipse':
      return 'canvas.tools.shape'
    case 'draw':
      return 'canvas.tools.draw'
    case 'image':
      return 'canvas.tools.image'
    default:
      return 'canvas.tools.document'
  }
}
