/**
 * Core data model for the NEXUS canvas whiteboard.
 *
 * Everything here is plain serialisable data: the canvas store persists
 * `canvases` to localStorage and history snapshots are plain copies, so no
 * class instances or DOM references are allowed.
 */

export interface Vec {
  x: number
  y: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** Konva stage transform: content position on screen + scale. */
export interface Viewport {
  x: number
  y: number
  scale: number
}

export type ShapeKind = 'rect' | 'ellipse'

export type TextAlign = 'left' | 'center' | 'right'

export type AlignMode = TextAlign | 'top' | 'middle' | 'bottom'

/** Attachment point of a connector on an object. */
export type AnchorSide = 'top' | 'right' | 'bottom' | 'left' | 'center'

/**
 * Tools that are real modes on the board. Image / document are commands
 * (file picker / note picker) rather than persistent modes.
 */
export type Tool =
  | 'select'
  | 'hand'
  | 'sticky'
  | 'text'
  | ShapeKind
  | 'connector'
  | 'draw'
  | 'eraser'

/** Object kinds that can be created by click / drag. */
export type CreationKind = 'sticky' | 'text' | ShapeKind

export type ObjectKind =
  | 'sticky'
  | 'text'
  | ShapeKind
  | 'draw'
  | 'image'
  | 'document'

export interface BaseObject {
  id: string
  kind: ObjectKind
  x: number
  y: number
  width: number
  height: number
  rotation: number
  /** 0..1 */
  opacity: number
  /** Objects sharing a group id are selected / moved / deleted together. */
  groupId: string | null
}

export interface StickyObject extends BaseObject {
  kind: 'sticky'
  text: string
  fill: string
  textColor: string
  fontSize: number
}

export interface TextObject extends BaseObject {
  kind: 'text'
  text: string
  color: string
  fontSize: number
  bold: boolean
  align: TextAlign
}

export interface ShapeObject extends BaseObject {
  kind: ShapeKind
  fill: string
  stroke: string
  strokeWidth: number
}

export interface DrawObject extends BaseObject {
  kind: 'draw'
  /** Flat `[x0, y0, x1, y1, …]` list relative to the object's top-left corner. */
  points: number[]
  stroke: string
  strokeWidth: number
}

export interface ImageObject extends BaseObject {
  kind: 'image'
  /** Data URL — images are stored inline, no file system access needed. */
  src: string
}

export interface DocumentObject extends BaseObject {
  kind: 'document'
  /** Workspace note id. The note may have been deleted since it was placed. */
  nodeId: string
}

export type CanvasObject =
  | StickyObject
  | TextObject
  | ShapeObject
  | DrawObject
  | ImageObject
  | DocumentObject

export interface ConnectionEnd {
  objectId: string
  anchor: AnchorSide
}

export interface Connection {
  id: string
  from: ConnectionEnd
  to: ConnectionEnd
  stroke: string
  strokeWidth: number
  arrow: boolean
  dashed: boolean
}

export interface CanvasDoc {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  objects: CanvasObject[]
  connections: Connection[]
  viewport: Viewport
}

export interface CanvasSnapshot {
  objects: CanvasObject[]
  connections: Connection[]
}

export interface CanvasHistory {
  past: CanvasSnapshot[]
  future: CanvasSnapshot[]
}

/** A single object delta used for live drags and property edits. */
export interface ObjectUpdate {
  id: string
  patch: Record<string, unknown>
}
