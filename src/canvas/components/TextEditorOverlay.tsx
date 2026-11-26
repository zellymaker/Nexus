/**
 * HTML textarea laid over the Konva object for inline sticky / text editing.
 * Coordinates are converted from world space to stage pixels using the
 * current viewport, rotation included.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import type { StickyObject, TextObject, Viewport } from '../types'
import { chrome, fontStack } from '../theme'

export interface TextEditorOverlayProps {
  object: StickyObject | TextObject
  viewport: Viewport
  onChange: (text: string) => void
  onClose: () => void
}

export function TextEditorOverlay({ object, viewport, onChange, onClose }: TextEditorOverlayProps) {
  const [text, setText] = useState(object.text)
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const sticky = object.kind === 'sticky'
  const scale = viewport.scale

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.focus()
    const end = element.value.length
    element.setSelectionRange(end, end)
  }, [])

  const width = Math.max(40, object.width * scale)
  const height = Math.max(28, object.height * scale)
  const padding = sticky ? Math.round(14 * scale) : 0

  const close = () => {
    onClose()
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: viewport.x + object.x * scale,
        top: viewport.y + object.y * scale,
        width,
        height,
        transform: `rotate(${object.rotation}deg)`,
        transformOrigin: '0 0',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <textarea
        ref={ref}
        value={text}
        spellCheck={false}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          onChange(next)
        }}
        onBlur={close}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') {
            event.preventDefault()
            close()
          } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            close()
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding,
          border: `1px solid ${chrome.accent}`,
          borderRadius: sticky ? Math.max(6, Math.round(8 * scale)) : 4,
          background: sticky ? object.fill : 'rgba(0, 0, 0, 0.06)',
          color: sticky ? object.textColor : object.color,
          fontFamily: fontStack,
          fontSize: Math.max(8, object.fontSize * scale),
          fontWeight: object.kind === 'text' && object.bold ? 600 : 400,
          lineHeight: sticky ? 1.35 : 1.25,
          textAlign: sticky ? 'left' : object.align,
          resize: 'none',
          outline: 'none',
          overflow: 'hidden',
          pointerEvents: 'auto',
          caretColor: sticky ? object.textColor : object.color,
          boxShadow: '0 0 0 3px rgba(135, 127, 254, 0.16)',
        }}
      />
    </div>
  )
}
