import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { Note } from '../lib/data'

interface NoteEditorProps {
  note: Note
  editorRef: RefObject<HTMLDivElement | null>
  onOpenByTitle: (title: string) => void
  onContentChange: (id: string, html: string) => void
}

export function NoteEditor({
  note,
  editorRef,
  onOpenByTitle,
  onContentChange,
}: NoteEditorProps) {
  useEffect(() => {
    const el = editorRef.current
    if (el) el.innerHTML = note.content
    // content is only seeded when the document changes; user edits stay in the DOM
    // (state is synced on input, but re-rendering must not reset the caret)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  return (
    <div
      ref={(el) => {
        editorRef.current = el
      }}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-multiline="true"
      aria-label={`${note.title} markdown editor`}
      className="editor-content min-h-full"
      onInput={(e) => onContentChange(note.id, e.currentTarget.innerHTML)}
      onClick={(e) => {
        const link = (e.target as HTMLElement).closest<HTMLElement>('.note-link')
        const ref =
          link?.dataset.note ?? link?.textContent?.replace(/[[\]]/g, '')
        if (ref) {
          e.preventDefault()
          onOpenByTitle(ref)
        }
      }}
    />
  )
}
