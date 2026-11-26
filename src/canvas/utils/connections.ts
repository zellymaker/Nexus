/**
 * Connector helpers: endpoints follow object anchors, connections die with
 * their objects.
 */
import type { Bounds, CanvasObject, Connection, Vec } from '../types'
import { DEFAULT_CONNECTION_STROKE, DEFAULT_CONNECTION_WIDTH } from '../palette'
import { anchorPoint, autoAnchors, unionBounds } from './geometry'
import { uid } from './objects'

export function makeConnection(source: CanvasObject, target: CanvasObject): Connection {
  const anchors = autoAnchors(source, target)
  return {
    id: uid(),
    from: { objectId: source.id, anchor: anchors.from },
    to: { objectId: target.id, anchor: anchors.to },
    stroke: DEFAULT_CONNECTION_STROKE,
    strokeWidth: DEFAULT_CONNECTION_WIDTH,
    arrow: true,
    dashed: false,
  }
}

export function connectionEndpoints(
  connection: Connection,
  byId: Map<string, CanvasObject>,
): [Vec, Vec] | null {
  const source = byId.get(connection.from.objectId)
  const target = byId.get(connection.to.objectId)
  if (!source || !target) return null
  return [anchorPoint(source, connection.from.anchor), anchorPoint(target, connection.to.anchor)]
}

/** Drop connections whose objects were deleted. */
export function pruneConnections(
  connections: Connection[],
  objects: CanvasObject[],
): Connection[] {
  const ids = new Set(objects.map((object) => object.id))
  return connections.filter(
    (connection) => ids.has(connection.from.objectId) && ids.has(connection.to.objectId),
  )
}

export function connectionBounds(
  connection: Connection,
  byId: Map<string, CanvasObject>,
): Bounds | null {
  const endpoints = connectionEndpoints(connection, byId)
  if (!endpoints) return null
  const [from, to] = endpoints
  return {
    x: Math.min(from.x, to.x),
    y: Math.min(from.y, to.y),
    width: Math.abs(to.x - from.x),
    height: Math.abs(to.y - from.y),
  }
}

/** Bounds covering all objects and connectors (used by "fit to content"). */
export function contentBounds(
  objects: CanvasObject[],
  connections: Connection[],
): Bounds | null {
  const byId = new Map(objects.map((object) => [object.id, object]))
  const bounds: Bounds[] = []
  for (const object of objects) {
    bounds.push({
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    })
  }
  for (const connection of connections) {
    const endpoints = connectionEndpoints(connection, byId)
    if (!endpoints) continue
    const [from, to] = endpoints
    bounds.push({
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
    })
  }
  return unionBounds(bounds)
}
