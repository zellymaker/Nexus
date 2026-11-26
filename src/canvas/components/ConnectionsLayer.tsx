/**
 * Connector layer: arrows/lines between object anchors. Rendered below the
 * objects layer so cards and stickies stay visually on top.
 */
import { Arrow, Circle, Group, Line } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { CanvasObject, Connection } from '../types'
import type { CanvasTokens } from '../hooks/useCanvasTokens'
import { connectionEndpoints } from '../utils/connections'

export interface ConnectionsLayerProps {
  connections: Connection[]
  objects: CanvasObject[]
  selection: string[]
  tokens: CanvasTokens
  onSelect: (id: string, additive: boolean) => void
  onContextMenu: (id: string, clientX: number, clientY: number) => void
}

export function ConnectionsLayer({
  connections,
  objects,
  selection,
  tokens,
  onSelect,
  onContextMenu,
}: ConnectionsLayerProps) {
  const byId = new Map(objects.map((object) => [object.id, object]))

  return (
    <>
      {connections.map((connection) => {
        const endpoints = connectionEndpoints(connection, byId)
        if (!endpoints) return null
        const [from, to] = endpoints
        const selected = selection.includes(connection.id)
        const points = [from.x, from.y, to.x, to.y]
        const handleClick = (event: KonvaEventObject<MouseEvent>) => {
          event.cancelBubble = true
          onSelect(connection.id, event.evt.shiftKey)
        }
        const handleContextMenu = (event: KonvaEventObject<PointerEvent>) => {
          event.evt.preventDefault()
          event.cancelBubble = true
          onContextMenu(connection.id, event.evt.clientX, event.evt.clientY)
        }
        const lineProps = {
          id: connection.id,
          points,
          stroke: connection.stroke,
          strokeWidth: connection.strokeWidth,
          dash: connection.dashed ? [8, 6] : undefined,
          hitStrokeWidth: 18,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
          onClick: handleClick,
          onContextMenu: handleContextMenu,
        }
        return (
          <Group key={connection.id}>
            {selected && (
              <Line
                points={points}
                stroke={tokens.accent}
                strokeWidth={connection.strokeWidth + 6}
                opacity={0.22}
                lineCap="round"
                listening={false}
              />
            )}
            {connection.arrow ? (
              <Arrow
                {...lineProps}
                fill={connection.stroke}
                pointerLength={9}
                pointerWidth={8}
                pointerAtBeginning={false}
              />
            ) : (
              <Line {...lineProps} />
            )}
            <Circle
              x={from.x}
              y={from.y}
              radius={2.4}
              fill={connection.stroke}
              opacity={0.9}
              listening={false}
            />
            <Circle
              x={to.x}
              y={to.y}
              radius={2.4}
              fill={connection.stroke}
              opacity={0.9}
              listening={false}
            />
          </Group>
        )
      })}
    </>
  )
}
