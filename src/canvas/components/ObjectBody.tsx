/**
 * Konva rendering of one canvas object body (sticky / text / shape / ink /
 * image / document card). Coordinates are local to the object's group; the
 * parent `ObjectShape` group carries the world transform.
 */
import { useEffect, useState } from 'react'
import { Ellipse, Image as KonvaImage, Line, Rect, Text } from 'react-konva'
import type {
  CanvasObject,
  DocumentObject,
  DrawObject,
  ImageObject,
  ShapeObject,
  StickyObject,
  TextObject,
} from '../types'
import type { CanvasTokens } from '../hooks/useCanvasTokens'
import { fontStack } from '../theme'
import { DocumentCard } from './DocumentCard'

const imageCache = new Map<string, HTMLImageElement>()

function useKonvaImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(
    () => imageCache.get(src) ?? null,
  )

  useEffect(() => {
    const cached = imageCache.get(src)
    if (cached) {
      setImage(cached)
      return
    }
    const element = new window.Image()
    element.crossOrigin = 'anonymous'
    element.onload = () => {
      imageCache.set(src, element)
      setImage(element)
    }
    element.src = src
    return () => {
      element.onload = null
    }
  }, [src])

  return image
}

function ImageBody({ object, tokens }: { object: ImageObject; tokens: CanvasTokens }) {
  const image = useKonvaImage(object.src)
  if (!image) {
    return (
      <Rect
        width={object.width}
        height={object.height}
        cornerRadius={6}
        fill={tokens.surface2}
        stroke={tokens.border}
        strokeWidth={1}
        listening={false}
      />
    )
  }
  return (
    <KonvaImage image={image} width={object.width} height={object.height} listening={false} />
  )
}

function StickyBody({ object, editing }: { object: StickyObject; editing: boolean }) {
  return (
    <>
      <Rect
        width={object.width}
        height={object.height}
        cornerRadius={8}
        fill={object.fill}
        shadowColor="rgba(0, 0, 0, 0.28)"
        shadowBlur={12}
        shadowOffsetY={3}
        shadowOpacity={0.6}
        listening={false}
      />
      {!editing && (
        <Text
          x={14}
          y={13}
          width={Math.max(10, object.width - 28)}
          height={Math.max(10, object.height - 26)}
          text={object.text}
          fontSize={object.fontSize}
          lineHeight={1.35}
          fontFamily={fontStack}
          fill={object.textColor}
          wrap="word"
          ellipsis
          listening={false}
        />
      )}
    </>
  )
}

function TextBody({ object, editing }: { object: TextObject; editing: boolean }) {
  return (
    <Text
      width={object.width}
      height={object.height}
      text={editing ? '' : object.text}
      fontSize={object.fontSize}
      fontStyle={object.bold ? 'bold' : 'normal'}
      fontFamily={fontStack}
      fill={object.color}
      align={object.align}
      verticalAlign="top"
      lineHeight={1.25}
      wrap="word"
      ellipsis
      listening={false}
    />
  )
}

function ShapeBody({ object }: { object: ShapeObject }) {
  const stroke = object.strokeWidth > 0 ? object.stroke : undefined
  if (object.kind === 'ellipse') {
    const inset = object.strokeWidth / 2
    return (
      <Ellipse
        x={object.width / 2}
        y={object.height / 2}
        radiusX={Math.max(1, object.width / 2 - inset)}
        radiusY={Math.max(1, object.height / 2 - inset)}
        fill={object.fill}
        stroke={stroke}
        strokeWidth={object.strokeWidth}
        listening={false}
      />
    )
  }
  return (
    <Rect
      width={object.width}
      height={object.height}
      cornerRadius={8}
      fill={object.fill}
      stroke={stroke}
      strokeWidth={object.strokeWidth}
      listening={false}
    />
  )
}

function DrawBody({ object }: { object: DrawObject }) {
  return (
    <Line
      points={object.points}
      stroke={object.stroke}
      strokeWidth={object.strokeWidth}
      lineCap="round"
      lineJoin="round"
      tension={0.35}
      listening={false}
    />
  )
}

export interface ObjectBodyProps {
  object: CanvasObject
  tokens: CanvasTokens
  editing: boolean
  /** Resolved note title for document cards; `null` = deleted document. */
  documentTitle: string | null
  onRemoveDocument: () => void
}

export function ObjectBody({
  object,
  tokens,
  editing,
  documentTitle,
  onRemoveDocument,
}: ObjectBodyProps) {
  switch (object.kind) {
    case 'sticky':
      return <StickyBody object={object} editing={editing} />
    case 'text':
      return <TextBody object={object} editing={editing} />
    case 'rect':
    case 'ellipse':
      return <ShapeBody object={object} />
    case 'draw':
      return <DrawBody object={object} />
    case 'image':
      return <ImageBody object={object} tokens={tokens} />
    case 'document':
      return (
        <DocumentCardBody
          object={object}
          tokens={tokens}
          documentTitle={documentTitle}
          onRemoveDocument={onRemoveDocument}
        />
      )
    default:
      return null
  }
}

function DocumentCardBody({
  object,
  tokens,
  documentTitle,
  onRemoveDocument,
}: {
  object: DocumentObject
  tokens: CanvasTokens
  documentTitle: string | null
  onRemoveDocument: () => void
}) {
  return (
    <DocumentCard
      width={object.width}
      height={object.height}
      title={documentTitle}
      tokens={tokens}
      onRemove={documentTitle === null ? onRemoveDocument : undefined}
    />
  )
}
