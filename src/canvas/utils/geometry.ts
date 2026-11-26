/**
 * 2D geometry helpers for the canvas: rotated bounds, connector anchors,
 * viewport math (pan / zoom / fit) and hit-testing rectangles.
 */
import type { AnchorSide, Bounds, CanvasObject, Vec, Viewport } from '../types'

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const clampViewport = (viewport: Viewport): Viewport => ({
  ...viewport,
  scale: clamp(viewport.scale, MIN_ZOOM, MAX_ZOOM),
})

export function rotatePoint(point: Vec, origin: Vec, degrees: number): Vec {
  if (!degrees) return { x: point.x, y: point.y }
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

export function objectCenter(object: CanvasObject): Vec {
  return { x: object.x + object.width / 2, y: object.y + object.height / 2 }
}

/** The four corners of an object, rotation included. */
export function objectCorners(object: CanvasObject): Vec[] {
  const { x, y, width, height } = object
  const corners: Vec[] = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ]
  if (!object.rotation) return corners
  const center = objectCenter(object)
  return corners.map((corner) => rotatePoint(corner, center, object.rotation))
}

/** Axis-aligned bounds that enclose the (possibly rotated) object. */
export function objectBounds(object: CanvasObject): Bounds {
  if (!object.rotation) {
    return { x: object.x, y: object.y, width: object.width, height: object.height }
  }
  const corners = objectCorners(object)
  const xs = corners.map((corner) => corner.x)
  const ys = corners.map((corner) => corner.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  }
}

export function unionBounds(list: Bounds[]): Bounds | null {
  if (!list.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const bounds of list) {
    minX = Math.min(minX, bounds.x)
    minY = Math.min(minY, bounds.y)
    maxX = Math.max(maxX, bounds.x + bounds.width)
    maxY = Math.max(maxY, bounds.y + bounds.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function objectsBounds(objects: CanvasObject[]): Bounds | null {
  return unionBounds(objects.map(objectBounds))
}

export function normalizeRect(a: Vec, b: Vec): Bounds {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

export function rectsIntersect(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

/** World position of a connector anchor on an object. */
export function anchorPoint(object: CanvasObject, side: AnchorSide): Vec {
  const center = objectCenter(object)
  let local: Vec
  switch (side) {
    case 'top':
      local = { x: center.x, y: object.y }
      break
    case 'bottom':
      local = { x: center.x, y: object.y + object.height }
      break
    case 'left':
      local = { x: object.x, y: center.y }
      break
    case 'right':
      local = { x: object.x + object.width, y: center.y }
      break
    default:
      local = center
  }
  return object.rotation ? rotatePoint(local, center, object.rotation) : local
}

/** Which side of `object` is closest to an arbitrary world point. */
export function anchorSideTowards(object: CanvasObject, point: Vec): AnchorSide {
  const bounds = objectBounds(object)
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const dx = point.x - center.x
  const dy = point.y - center.y
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'bottom' : 'top'
}

export function autoAnchors(
  source: CanvasObject,
  target: CanvasObject,
): { from: AnchorSide; to: AnchorSide } {
  const a = objectCenter(source)
  const b = objectCenter(target)
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { from: 'right', to: 'left' } : { from: 'left', to: 'right' }
  }
  return dy >= 0 ? { from: 'bottom', to: 'top' } : { from: 'top', to: 'bottom' }
}

export function screenToWorld(viewport: Viewport, point: Vec): Vec {
  return {
    x: (point.x - viewport.x) / viewport.scale,
    y: (point.y - viewport.y) / viewport.scale,
  }
}

export function worldToScreen(viewport: Viewport, point: Vec): Vec {
  return {
    x: point.x * viewport.scale + viewport.x,
    y: point.y * viewport.scale + viewport.y,
  }
}

/** Zoom keeping `screenPoint` (stage pixels) anchored to the same world point. */
export function zoomAt(
  viewport: Viewport,
  nextScale: number,
  screenPoint: Vec,
): Viewport {
  const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM)
  const world = screenToWorld(viewport, screenPoint)
  return {
    scale,
    x: screenPoint.x - world.x * scale,
    y: screenPoint.y - world.y * scale,
  }
}

/** Viewport that fits `bounds` into `size` with a padding in screen pixels. */
export function fitBounds(
  bounds: Bounds | null,
  size: { width: number; height: number },
  padding = 90,
): Viewport {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0 || size.width <= 0) {
    return { x: size.width / 2, y: size.height / 2, scale: 1 }
  }
  const scale = clamp(
    Math.min(
      (size.width - padding * 2) / bounds.width,
      (size.height - padding * 2) / bounds.height,
    ),
    MIN_ZOOM,
    MAX_ZOOM,
  )
  return {
    scale,
    x: size.width / 2 - (bounds.x + bounds.width / 2) * scale,
    y: size.height / 2 - (bounds.y + bounds.height / 2) * scale,
  }
}

/** Viewport centred on `bounds`, but never closer than `maxScale`. */
export function centerBounds(
  bounds: Bounds | null,
  size: { width: number; height: number },
  maxScale = 1.5,
): Viewport {
  if (!bounds || size.width <= 0) {
    return { x: size.width / 2, y: size.height / 2, scale: 1 }
  }
  const scale = clamp(
    Math.min(
      Math.min((size.width - 160) / Math.max(bounds.width, 1), (size.height - 160) / Math.max(bounds.height, 1)),
      maxScale,
    ),
    MIN_ZOOM,
    MAX_ZOOM,
  )
  return {
    scale,
    x: size.width / 2 - (bounds.x + bounds.width / 2) * scale,
    y: size.height / 2 - (bounds.y + bounds.height / 2) * scale,
  }
}

/** World rectangle currently visible in the stage. */
export function visibleWorldRect(
  viewport: Viewport,
  size: { width: number; height: number },
): Bounds {
  const topLeft = screenToWorld(viewport, { x: 0, y: 0 })
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: size.width / viewport.scale,
    height: size.height / viewport.scale,
  }
}
