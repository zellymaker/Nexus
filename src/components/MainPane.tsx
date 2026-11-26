import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  CircleDot,
  Cog,
  Ellipsis,
  House,
  SquareArrowOutUpRight,
} from 'lucide-react'
import { nodePath, useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { formatRelative } from '../lib/format'
import { CanvasWorkspace } from '../canvas/CanvasWorkspace'
import { SettingsView } from '../settings/SettingsView'
import { FormattingToolbar } from './FormattingToolbar'
import type { FormatAction } from './FormattingToolbar'
import { NoteEditor } from './NoteEditor'
import { NotesListView } from './NotesListView'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

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
      className="grid h-[26px] w-[26px] place-items-center rounded-[6px] text-ink-dim transition-colors hover:bg-hover hover:text-ink"
    >
      {children}
    </button>
  )
}

export function MainPane() {
  const view = useStore((s) => s.view)
  const nodes = useStore((s) => s.nodes)
  const activeTabId = useStore((s) => s.activeTabId)
  const leftOpen = useStore((s) => s.leftOpen)
  const rightOpen = useStore((s) => s.rightOpen)
  const setLeftOpen = useStore((s) => s.setLeftOpen)
  const setRightOpen = useStore((s) => s.setRightOpen)
  const setView = useStore((s) => s.setView)
  const setNav = useStore((s) => s.setNav)
  const openNote = useStore((s) => s.openNote)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [linkModal, setLinkModal] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const t = useT()

  const activeNode = nodes[activeTabId]

  const title =
    view.kind === 'note'
      ? (activeNode?.name ?? t('nav.home', 'Home'))
      : view.kind === 'list'
        ? view.title
        : view.kind === 'canvas'
          ? t('view.canvas', 'Canvas')
          : t('view.settings', 'Settings')

  const crumbs = useMemo(() => {
    if (view.kind === 'note' && activeNode) {
      const path = nodePath(nodes, activeNode.id)
      const parents = path.slice(0, -1).map((n) => n.name)
      return ['Home', ...parents]
    }
    return ['Home', title]
  }, [view, activeNode, nodes, title])

  const goHome = () => {
    setView({ kind: 'note' })
    setNav('home')
  }

  const openCanvas = () => {
    setView({ kind: 'canvas' })
    setNav('canvas')
  }

  const openSettings = () => {
    setView({ kind: 'settings', section: 'general' })
    setNav('settings')
  }

  const focusMode = () => {
    const hidden = !leftOpen && !rightOpen
    setLeftOpen(!hidden)
    setRightOpen(!hidden)
  }

  const runFormat = (action: FormatAction) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    switch (action) {
      case 'scroll-top':
        el.closest<HTMLElement>('[data-editor-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' })
        return
      case 'heading':
        document.execCommand('formatBlock', false, 'h2')
        break
      case 'bold':
        document.execCommand('bold')
        break
      case 'italic':
        document.execCommand('italic')
        break
      case 'underline':
        document.execCommand('underline')
        break
      case 'link':
        setLinkValue('')
        setLinkModal(true)
        return
      case 'ul':
        document.execCommand('insertUnorderedList')
        break
      case 'ol':
        document.execCommand('insertOrderedList')
        break
      case 'code':
        document.execCommand('formatBlock', false, 'pre')
        break
      case 'clear':
        document.execCommand('removeFormat')
        break
    }
    el.focus()
    const s = useStore.getState()
    if (s.nodes[s.activeTabId]) s.updateNoteContent(s.activeTabId, el.innerHTML)
  }

  const applyLink = (rawValue: string) => {
    const el = editorRef.current
    const value = rawValue.trim()
    if (!value) return
    setLinkModal(false)
    if (!el) return
    el.focus()
    const selection = window.getSelection()
    const href = /^https?:\/\//i.test(value) || value.startsWith('mailto:') ? value : `https://${value}`
    if (selection && selection.toString().length > 0) {
      document.execCommand('createLink', false, href)
    } else {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${href.replace(/"/g, '&quot;')}">${value.replace(/</g, '&lt;')}</a>`,
      )
    }
    el.focus()
    const s = useStore.getState()
    if (s.nodes[s.activeTabId]) s.updateNoteContent(s.activeTabId, el.innerHTML)
  }

  const goBreadcrumb = (index: number, crumb: string) => {
    if (index === 0) {
      goHome()
      return
    }
    const state = useStore.getState()
    if (view.kind === 'note' && activeNode) {
      const path = nodePath(state.nodes, activeNode.id)
      const target = path.find((n) => n.name === crumb)
      if (target) {
        if (target.kind === 'folder') {
          setView({
            kind: 'list',
            title: target.name,
            filter: 'folder',
            folderId: target.id,
          })
        } else openNote(target.id)
        return
      }
    }
    if (view.kind === 'list' && view.filter === 'folder' && view.folderId) {
      openNote(view.folderId)
    }
  }

  const isNoteView = view.kind === 'note'
  const contentPadding =
    view.kind === 'canvas' ? '' : 'pl-[68px] pr-[68px]'

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-main">
      {/* header */}
      <div className="shrink-0 pt-[9px]">
        <div className="flex items-center justify-between pl-[16px] pr-[18px]">
          <div className="flex items-center gap-[7px]">
            <button
              type="button"
              title={t('view.backToNote', 'Back to note')}
              aria-label={t('view.backToNote', 'Back to note')}
              onClick={goHome}
              className="grid h-[24px] w-[24px] place-items-center rounded-[5px] text-ink-dim transition-colors hover:bg-hover hover:text-ink"
            >
              <House size={17} strokeWidth={1.8} />
            </button>
            <span className="text-ink-faint">
              <ArrowRight size={16} strokeWidth={1.8} />
            </span>
          </div>

          <div className="flex items-center gap-[4px]">
            <HeaderIcon label={t('palette.toggleLeft', 'Focus mode')} onClick={focusMode}>
              <SquareArrowOutUpRight size={16} strokeWidth={1.8} />
            </HeaderIcon>
            <HeaderIcon label={t('palette.openCanvas', 'Canvas')} onClick={openCanvas}>
              <CircleDot size={16} strokeWidth={1.8} />
            </HeaderIcon>
            <HeaderIcon label={t('nav.settings', 'Settings')} onClick={openSettings}>
              <Cog size={16} strokeWidth={1.8} />
            </HeaderIcon>
            <HeaderIcon
              label={t('titlebar.palette', 'Command palette')}
              onClick={() => useStore.getState().setPaletteOpen(true)}
            >
              <Ellipsis size={17} strokeWidth={1.9} />
            </HeaderIcon>
          </div>
        </div>

        <div className="px-[68px] pt-[6px]">
          <h1 className="truncate text-[30px] font-semibold leading-[38px] tracking-[-0.022em] text-ink">
            {title}
          </h1>

          <div className="mt-[5px] flex items-baseline justify-between gap-6">
            <nav aria-label="Breadcrumbs" className="flex min-w-0 items-center gap-[7px] text-[13px]">
              {crumbs.map((crumb, index) => (
                <span key={`${crumb}-${index}`} className="flex items-center gap-[7px]">
                  {index > 0 && <span className="text-ink-faint">›</span>}
                  <button
                    type="button"
                    onClick={() => goBreadcrumb(index, crumb)}
                    className="truncate text-link transition-colors hover:text-accent-bright"
                  >
                    {crumb}
                  </button>
                </span>
              ))}
            </nav>
            {isNoteView && activeNode && (
              <span className="shrink-0 text-[13px] text-ink-mute">
                {t('doc.lastModified', 'Last modified: {time}').replace(
                  '{time}',
                  formatRelative(activeNode.updatedAt, t),
                )}
              </span>
            )}
          </div>

          <div className="mt-[11px] border-t border-line" />
        </div>
      </div>

      {isNoteView && (
        <div className="flex shrink-0 justify-center pb-[1px] pt-[10px]">
          <FormattingToolbar onFormat={runFormat} />
        </div>
      )}

      {view.kind === 'canvas' ? (
        <div className="relative min-h-0 flex-1">
          <CanvasWorkspace />
        </div>
      ) : (
        <div
          data-editor-scroll
          className={`scroll-thin min-h-0 flex-1 overflow-y-auto pt-[3px] ${contentPadding}`}
        >
          {view.kind === 'note' && activeNode && (
            <div key={activeNode.id} className="anim-view-in">
              <NoteEditor
                noteId={activeNode.id}
                editorRef={editorRef}
                onOpenNote={openNote}
              />
            </div>
          )}
          {view.kind === 'note' && !activeNode && (
            <p className="pt-4 text-[13px] text-ink-mute">
              {t('view.emptyAllNotes', 'No notes yet. Create your first one with Ctrl + N.')}
            </p>
          )}
          {view.kind === 'list' && (
            <div className="pt-[18px]">
              <NotesListView view={view} />
            </div>
          )}
          {view.kind === 'settings' && (
            <div className="pt-[16px]">
              <SettingsView
                section={view.section}
                onSectionChange={(section) => setView({ kind: 'settings', section })}
              />
            </div>
          )}
        </div>
      )}
      <Modal
        open={linkModal}
        onClose={() => setLinkModal(false)}
        title={t('editor.link', 'Insert link')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLinkModal(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="primary" onClick={() => applyLink(linkValue)}>
              {t('common.apply', 'Apply')}
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={linkValue}
          onChange={(event) => setLinkValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') applyLink(linkValue)
          }}
          placeholder="https://…"
          aria-label={t('editor.link', 'Insert link')}
          className="w-full rounded-lg border border-line bg-input px-3 py-2 text-[13px] text-ink outline-none focus:border-accent-soft"
        />
      </Modal>
    </main>
  )
}

