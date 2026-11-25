import { useId, useState } from 'react'

interface Node {
  x: number
  y: number
  r: number
  tone: 'purple' | 'white'
}

const NODES: Node[] = [
  { x: 104, y: 20, r: 3.9, tone: 'purple' },
  { x: 146, y: 40, r: 3.4, tone: 'white' },
  { x: 182, y: 62, r: 4.1, tone: 'purple' },
  { x: 150, y: 86, r: 3.4, tone: 'white' },
  { x: 104, y: 94, r: 3.9, tone: 'white' },
  { x: 60, y: 86, r: 3.4, tone: 'purple' },
  { x: 22, y: 62, r: 4.1, tone: 'white' },
  { x: 52, y: 38, r: 3.4, tone: 'white' },
]

const CENTER: Node = { x: 104, y: 56, r: 4.6, tone: 'white' }

const OUTER_EDGES: [number, number][] = []
for (let i = 0; i < NODES.length; i++) {
  OUTER_EDGES.push([i, (i + 2) % NODES.length])
  OUTER_EDGES.push([i, (i + 3) % NODES.length])
}

const SPOKES: [number, number, number, number][] = [
  [104, 20, 112, 4],
  [146, 40, 162, 24],
  [182, 62, 204, 62],
  [150, 86, 168, 102],
  [104, 94, 104, 110],
  [60, 86, 42, 102],
  [22, 62, 1, 62],
  [52, 38, 38, 22],
]

const allNodes = [...NODES, CENTER]

const edgePath = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  `M ${a.x} ${a.y} L ${b.x} ${b.y}`

export function GraphPreview({
  className = '',
  onNodeClick,
}: {
  className?: string
  onNodeClick?: (index: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const id = useId().replace(/[:]/g, '')
  const gradId = `graph-bg-${id}`
  const edgeGradId = `graph-edge-${id}`

  return (
    <svg
      viewBox="0 0 204 110"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Knowledge graph preview"
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#3a3766" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#24242b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={edgeGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8f88ec" />
          <stop offset="100%" stopColor="#4e4a86" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="204" height="110" fill="#23232b" rx="10" />
      <rect x="0" y="0" width="204" height="110" fill={`url(#${gradId})`} rx="10" />

      <g stroke="#585866" strokeWidth="0.7" strokeLinecap="round" opacity="0.9">
        {SPOKES.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>

      <g
        stroke={`url(#${edgeGradId})`}
        strokeWidth={(hovered === null ? 0.75 : 0.9) as number}
        strokeLinecap="round"
        opacity="0.85"
      >
        {OUTER_EDGES.map(([a, b], i) => (
          <path key={i} d={edgePath(NODES[a], NODES[b])} />
        ))}
        {NODES.map((n, i) => (
          <path key={`c-${i}`} d={edgePath(n, CENTER)} opacity={hovered === i || hovered === 8 ? 0.55 : 1} />
        ))}
      </g>

      {allNodes.map((n, i) => {
        const fill = n.tone === 'purple' ? '#877ffe' : '#e9e9f1'
        return (
          <g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onNodeClick?.(i)}
            className="cursor-pointer"
          >
            <circle cx={n.x} cy={n.y} r={n.r + 3.2} fill={fill} opacity="0.14" />
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={fill}
              opacity={hovered === i ? 1 : 0.95}
            />
          </g>
        )
      })}
    </svg>
  )
}
