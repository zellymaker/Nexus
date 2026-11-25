import {
  ArrowRight,
  CircleDot,
  Cog,
  Ellipsis,
  House,
  SquareArrowOutUpRight,
} from 'lucide-react'
import type { RefObject } from 'react'
import type { Note } from '../lib/data'
import { FormattingToolbar } from './FormattingToolbar'
import type { FormatAction } from './FormattingToolbar'
import { NoteEditor } from './NoteEditor'
import { GraphPage, NotesListView, SettingsPage } from './Views'
import type { SettingsProps } from './Views'

export type ViewState =
  | { kind: 'note' }
  | {
      kind: 'list'
      title: string
      filter: 'all' | 'favorites' | 'recent' | 'projects'
    }
  | { kind: 'graph' }
  | { kind: 'settings' }

interface MainPaneProps {
  view: ViewState
  note: Note
  notes: Note[]
  editorRef: RefObject<HTMLDivElement | null>
  showModified: boolean
  settings: SettingsProps
  onOpenNote: (noteId: string) => void
  onOpenByTitle: (title: string) => void
  onHome: () => void
  onFormat: (action: FormatAction) => void
  onOpenPalette: () => void
  onSettings: () => void
  onGraph: () => void
  onFocusMode: () => void
  onContentChange: (id: string, html: string) => void
}

function HeaderIcon({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-[26px] w-[26px] place-items-center rounded-[6px] text-[#a2a2ac] transition-colors hover:bg-white/[0.06] hover:text-[#e2e2e8]"
    >
      {children}
    </button>
  )
}

export function MainPane({
  view,
  note,
  notes,
  editorRef,
  showModified,
  settings,
  onOpenNote,
  onOpenByTitle,
  onHome,
  onFormat,
  onOpenPalette,
  onSettings,
  onGraph,
  onFocusMode,
  onContentChange,
}: MainPaneProps) {
  const isNote = view.kind === 'note'
  const title =
    view.kind === 'note'
      ? note.title
      : view.kind === 'list'
        ? view.title
        : view.kind === 'graph'
          ? 'Graph View'
          : 'Settings'

  const crumbs = view.kind === 'note' ? note.meta.breadcrumbs : ['Home', title]

  const listNotes =
    view.kind === 'list'
      ? view.filter === 'favorites'
        ? notes.filter((n) =>
            ['second-brain', 'productivity-system'].includes(n.id),
          )
        : view.filter === 'recent'
          ? notes.slice(0, 4)
          : view.filter === 'projects'
            ? notes.filter((n) =>
                ['second-brain', 'projects-overview', 'team-sync'].includes(
                  n.id,
                ),
              )
            : notes
      : []

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-pane-main">
      {/* top chrome row — aligned to the pane edges, like the reference */}
      <div className="flex shrink-0 items-center justify-between pl-[16px] pr-[18px] pt-[11px]">
        <div className="flex items-center gap-[7px]">
          <button
            type="button"
            title="Back to note"
            aria-label="Back to note"
            onClick={onHome}
            className="grid h-[24px] w-[24px] place-items-center rounded-[5px] text-[#a9a9b3] transition-colors hover:bg-white/[0.06] hover:text-[#e2e2e8]"
          >
            <House size={17} strokeWidth={1.8} />
          </button>
          <span className="text-[#6d6d77]">
            <ArrowRight size={16} strokeWidth={1.8} />
          </span>
        </div>

        <div className="flex items-center gap-[4px]">
          <HeaderIcon label="Focus mode" onClick={onFocusMode}>
            <SquareArrowOutUpRight size={16} strokeWidth={1.8} />
          </HeaderIcon>
          <HeaderIcon label="Graph view" onClick={onGraph}>
            <CircleDot size={16} strokeWidth={1.8} />
          </HeaderIcon>
          <HeaderIcon label="Settings" onClick={onSettings}>
            <Cog size={16} strokeWidth={1.8} />
          </HeaderIcon>
          <HeaderIcon label="Command palette" onClick={onOpenPalette}>
            <Ellipsis size={17} strokeWidth={1.9} />
          </HeaderIcon>
        </div>
      </div>

      {/* document heading block */}
      <div className="shrink-0 px-[68px] pt-[6px]">
        <h1 className="truncate text-[30px] font-semibold leading-[38px] tracking-[-0.022em] text-[#f2f2f6]">
          {title}
        </h1>

        <div className="mt-[5px] flex items-baseline justify-between gap-6">
          <nav
            aria-label="Breadcrumbs"
            className="flex min-w-0 items-center gap-[7px] text-[13px]"
          >
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1
              return (
                <span key={`${crumb}-${i}`} className="flex items-center gap-[7px]">
                  {i > 0 && <span className="text-[#5c5c66]">›</span>}
                  <button
                    type="button"
                    onClick={() => {
                      if (i === 0) onHome()
                      else if (last) onOpenByTitle(crumb)
                      else onOpenByTitle(crumb)
                    }}
                    className={`truncate transition-colors hover:text-[#b3adff] ${
                      last ? 'text-[#8d86f1]' : 'text-[#8d86f1]'
                    }`}
                  >
                    {crumb}
                  </button>
                </span>
              )
            })}
          </nav>
          {isNote && showModified && (
            <span className="shrink-0 text-[13px] text-[#7b7b85]">
              {note.meta.modified}
            </span>
          )}
        </div>

        <div className="mt-[11px] border-t border-line" />
      </div>

      {/* floating formatting toolbar */}
      {isNote && (
        <div className="flex shrink-0 justify-center pb-[1px] pt-[10px]">
          <FormattingToolbar onFormat={onFormat} />
        </div>
      )}

      {/* scrollable content */}
      <div
        data-editor-scroll
        className="scroll-thin flex-1 overflow-y-auto pl-[68px] pr-[68px] pt-[3px]"
      >
        {view.kind === 'note' && (
          <NoteEditor
            key={note.id}
            note={note}
            editorRef={editorRef}
            onOpenByTitle={onOpenByTitle}
            onContentChange={onContentChange}
          />
        )}
        {view.kind === 'list' && (
          <div className="pt-[18px]">
            <NotesListView notes={listNotes} onOpenNote={onOpenNote} />
          </div>
        )}
        {view.kind === 'graph' && (
          <div className="pt-[18px]">
            <GraphPage onOpenNote={onOpenNote} />
          </div>
        )}
        {view.kind === 'settings' && (
          <div className="pt-[18px]">
            <SettingsPage {...settings} />
          </div>
        )}
      </div>
    </main>
  )
}
