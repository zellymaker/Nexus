/**
 * Konva visual for a document card. Shows the referenced note title, or a
 * "Document deleted" state with a remove button when the note is gone.
 */
import { Circle, Group, Line, Rect, Text } from 'react-konva'
import type { CanvasTokens } from '../hooks/useCanvasTokens'
import { fontStack } from '../theme'

export interface DocumentCardProps {
  width: number
  height: number
  /** `null` means the referenced note no longer exists. */
  title: string | null
  tokens: CanvasTokens
  onRemove?: () => void
}

export function DocumentCard({ width, height, title, tokens, onRemove }: DocumentCardProps) {
  const missing = title === null
  const accent = missing ? tokens.danger : tokens.accent
  const textWidth = Math.max(10, width - 84 - (onRemove ? 28 : 0))
  const padding = 14

  return (
    <>
      <Rect
        width={width}
        height={height}
        cornerRadius={10}
        fill={tokens.surface2}
        stroke={missing ? tokens.danger : tokens.border}
        strokeWidth={1}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={10}
        shadowOffsetY={2}
      />
      <Rect
        x={10}
        y={10}
        width={4}
        height={Math.max(4, height - 20)}
        cornerRadius={2}
        fill={accent}
        opacity={0.85}
        listening={false}
      />
      <Rect
        x={padding + 8}
        y={padding + 2}
        width={30}
        height={22}
        cornerRadius={5}
        fill={accent}
        opacity={0.16}
        listening={false}
      />
      <Text
        x={padding + 8}
        y={padding + 6}
        width={30}
        height={14}
        text={missing ? '!' : '¶'}
        fontSize={12}
        fontStyle="bold"
        fontFamily={fontStack}
        fill={accent}
        align="center"
        listening={false}
      />
      <Text
        x={padding + 48}
        y={padding - 1}
        width={textWidth}
        height={18}
        text={missing ? 'Document deleted' : (title ?? 'Untitled')}
        fontSize={13.5}
        fontStyle="bold"
        fontFamily={fontStack}
        fill={missing ? tokens.danger : tokens.text}
        ellipsis
        wrap="none"
        listening={false}
      />
      <Text
        x={padding + 48}
        y={padding + 19}
        width={textWidth}
        height={16}
        text={missing ? 'The note was removed from the workspace' : 'NEXUS document · click to open'}
        fontSize={11}
        fontFamily={fontStack}
        fill={tokens.dim}
        ellipsis
        wrap="none"
        listening={false}
      />
      {onRemove && (
        <Group
          x={width - 30}
          y={9}
          onClick={(event) => {
            event.cancelBubble = true
            onRemove()
          }}
          onMouseDown={(event) => {
            event.cancelBubble = true
          }}
          onMouseEnter={(event) => {
            const stage = event.target.getStage()
            if (stage) stage.container().style.cursor = 'pointer'
          }}
          onMouseLeave={(event) => {
            const stage = event.target.getStage()
            if (stage) stage.container().style.cursor = ''
          }}
        >
          <Circle x={11} y={11} radius={11} fill={tokens.surface3} />
          <Line points={[7.5, 7.5, 14.5, 14.5]} stroke={tokens.dim} strokeWidth={1.5} lineCap="round" />
          <Line points={[14.5, 7.5, 7.5, 14.5]} stroke={tokens.dim} strokeWidth={1.5} lineCap="round" />
        </Group>
      )}
    </>
  )
}
