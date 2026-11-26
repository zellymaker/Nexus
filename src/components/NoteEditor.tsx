import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { sanitizeHtml } from '../lib/sanitize'

interface NoteEditorProps {
  noteId: string
  editorRef: RefObject<HTMLDivElement | null>
  onOpenNote: (noteId: string) => void
}

interface GutterLine {
  top: number
  number: number
}

/**
 * Markdown-ish live editor built on contentEditable (keeps the reference look
 * of rendered headings/lists/quotes). Honours the user's editor settings:
 * wrapping, syntax highlight, line numbers, cursor style, autosave interval.
 */
export function NoteEditor({ noteId, editorRef, onOpenNote }: NoteEditorProps) {
  const node = useStore((s) => s.nodes[noteId])
  const settings = useStore((s) => s.settings)
  const updateNoteContent = useStore((s) => s.updateNoteContent)
  const t = useT()

  const dirtyRef = useRef<string | null>(null)
  const saveTimer = useRef<number | undefined>(undefined)
  const [gutter, setGutter] = useState<GutterLine[]>([])

  /* seed content when switching documents (keeps edits in the DOM while typing) */
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    el.innerHTML = sanitizeHtml(useStore.getState().nodes[noteId]?.content ?? '<p class="ed-p"></p>')
    dirtyRef.current = null
    requestAnimationFrame(() => recomputeGutter())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  useEffect(() => {
    if (settings.editor.lineNumbers) requestAnimationFrame(() => recomputeGutter())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.editor.lineNumbers, settings.editor.wrap, settings.editor.fontSize])

  const recomputeGutter = () => {
    const el = editorRef.current
    if (!el) return
    const lines: GutterLine[] = []
    const blocks = Array.from(el.children) as HTMLElement[]
    blocks.forEach((block, index) => {
      // count visual lines inside the block, then place one number per block
      const lineHeight = parseFloat(getComputedStyle(block).lineHeight || '23') || 23
      const visual = Math.max(1, Math.round(block.offsetHeight / lineHeight))
      for (let i = 0; i < visual; i++) {
        lines.push({ top: block.offsetTop + i * lineHeight, number: lines.length + 1 })
        if (lines.length > 500) break
      }
      void index
    })
    setGutter(lines)
  }

  const flushPendingAutosave = () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = undefined
    }
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    const state = useStore.getState()
    if (dirtyRef.current !== null && state.nodes[noteId]) {
      updateNoteContent(noteId, html)
    }
    dirtyRef.current = null
  }

  const commit = () => {
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    const state = useStore.getState()
    if (state.nodes[noteId] && state.nodes[noteId].content !== html) {
      updateNoteContent(noteId, html)
    }
    dirtyRef.current = null
  }

  /* commit pending edits on unmount (tab switch / leave editor) */
  useEffect(
    () => () => {
      flushPendingAutosave()
      if (dirtyRef.current !== null) {
        const html = dirtyRef.current
        const state = useStore.getState()
        if (state.nodes[noteId]) updateNoteContent(noteId, html)
        dirtyRef.current = null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noteId],
  )

  /* Ctrl+S / explicit save requests from the shortcut runtime */
  useEffect(() => {
    const onSave = () => {
      flushPendingAutosave()
      commit()
    }
    window.addEventListener('nexus:save', onSave)
    return () => window.removeEventListener('nexus:save', onSave)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  if (!node) return null

  const handleInput = () => {
    const el = editorRef.current
    if (!el) return
    if (settings.workspace.autosave) {
      dirtyRef.current = el.innerHTML
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      const delay = Math.max(150, settings.workspace.autosaveDelay)
      saveTimer.current = window.setTimeout(() => {
        saveTimer.current = undefined
        const html = dirtyRef.current
        if (html !== null) {
          updateNoteContent(noteId, html)
          dirtyRef.current = null
        }
      }, delay)
    } else {
      dirtyRef.current = el.innerHTML
    }
    if (settings.editor.lineNumbers) requestAnimationFrame(() => recomputeGutter())
  }

  return (
    <div className="relative">
      {settings.editor.lineNumbers && gutter.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-full top-0 mr-[10px] w-[26px] select-none text-right font-mono text-[11px] leading-[23px] text-ink-faint"
        >
          {gutter.map((line) => (
            <div key={line.number} style={{ position: 'absolute', top: line.top, right: 0 }}>
              {line.number}
            </div>
          ))}
        </div>
      )}
      <div
        ref={(el) => {
          editorRef.current = el
        }}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-multiline="true"
        aria-label={`${node.name} editor`}
        data-wrap={settings.editor.wrap ? 'on' : 'off'}
        data-cursor={settings.editor.cursorStyle}
        className={`editor-content min-h-full ${settings.editor.syntaxHighlight ? '' : 'no-syntax'}`}
        onInput={handleInput}
        onBlur={commit}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const html = event.dataTransfer.getData('text/html')
          if (html) document.execCommand('insertHTML', false, sanitizeHtml(html))
          else {
            const text = event.dataTransfer.getData('text/plain')
            if (text) document.execCommand('insertText', false, text)
          }
        }}
        onPaste={(event) => {
          const html = event.clipboardData.getData('text/html')
          if (!html) return
          event.preventDefault()
          document.execCommand('insertHTML', false, sanitizeHtml(html))
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          event.preventDefault()
          const spaces = ' '.repeat(settings.editor.tabSize)
          const selection = window.getSelection()
          if (!selection || selection.rangeCount === 0) return
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(document.createTextNode(spaces))
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
          handleInput()
        }}
        onClick={(event) => {
          const link = (event.target as HTMLElement).closest<HTMLElement>('.note-link')
          if (!link) return
          const ref = link.dataset.note ?? link.textContent?.replace(/[[\]]/g, '')
          if (!ref) return
          event.preventDefault()
          const state = useStore.getState()
          const byId = state.nodes[ref]
          if (byId?.kind === 'note') {
            onOpenNote(ref)
            return
          }
          const target = Object.values(state.nodes).find(
            (n) => n.kind === 'note' && n.name.toLowerCase() === ref.toLowerCase(),
          )
          if (target) onOpenNote(target.id)
        }}
      />
      {!node.content?.trim() && (
        <p className="pointer-events-none absolute left-0 top-0 text-[15px] text-ink-faint">
          {t('editor.placeholder', 'Start typing…')}
        </p>
      )}
    </div>
  )
}

