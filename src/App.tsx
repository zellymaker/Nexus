import { useEffect, useMemo, useRef, useState } from 'react'
import { CommandPalette } from './components/CommandPalette'
import { LeftSidebar } from './components/LeftSidebar'
import type { NavId } from './components/LeftSidebar'
import { MainPane } from './components/MainPane'
import type { ViewState } from './components/MainPane'
import { RightSidebar } from './components/RightSidebar'
import { TitleBar } from './components/TitleBar'
import type { TabInfo } from './components/TitleBar'
import type { FormatAction } from './components/FormattingToolbar'
import { COMMANDS, NOTES, WORKSPACE_TREE, emptyNote } from './lib/data'
import type { CommandId, Note, TreeNode } from './lib/data'

const ALIASES: Record<string, string> = {
  'note-taking app': 'second-brain',
  'digital garden': 'second-brain',
  'personal knowledge management': 'productivity-system',
  'prm tools': 'projects-overview',
  'roadmap q4': 'projects-overview',
  'design system': 'projects-overview',
  'weekly review': 'daily-notes',
  'sprint 12': 'team-sync',
  'meeting notes': 'team-sync',
  'knowledge management': 'second-brain',
  'projects overview': 'projects-overview',
  'team sync': 'team-sync',
  'daily notes': 'daily-notes',
  'building a second brain': 'second-brain',
  'productivity system': 'productivity-system',
  documents: 'documents',
  archive: 'documents',
  resources: 'productivity-system',
  products: 'documents',
}

const clampIndex = (i: number, len: number) => (len === 0 ? 0 : Math.min(i, len - 1))

export default function App() {
  const [notesMap, setNotesMap] = useState<Record<string, Note>>(() => {
    const map: Record<string, Note> = {}
    for (const n of NOTES) map[n.id] = n
    return map
  })
  const notes = useMemo(() => Object.values(notesMap), [notesMap])

  const [tabs, setTabs] = useState<string[]>([
    'second-brain',
    'projects-overview',
    'team-sync',
  ])
  const [activeTabId, setActiveTabId] = useState('second-brain')
  const [view, setView] = useState<ViewState>({ kind: 'note' })
  const [activeNav, setActiveNav] = useState<NavId>('home')
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [tree, setTree] = useState<TreeNode[]>(() => WORKSPACE_TREE)
  const [foldersOpen, setFoldersOpen] = useState<Record<string, boolean>>({
    'archive-expanded': true,
  })
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [paletteIndex, setPaletteIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPaletteHint, setShowPaletteHint] = useState(true)
  const [showModified, setShowModified] = useState(true)

  const editorRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const noteCounter = useRef(0)
  const folderCounter = useRef(0)

  const activeNote = notesMap[activeTabId] ?? notesMap['second-brain']

  /* ----------------------------- notes ----------------------------- */

  const openNote = (noteId: string) => {
    if (!notesMap[noteId]) {
      const title = noteId
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
      const fresh = emptyNote(noteId, title)
      setNotesMap((prev) => ({ ...prev, [noteId]: fresh }))
    }
    setTabs((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]))
    setActiveTabId(noteId)
    setView({ kind: 'note' })
    setActiveNav('home')
    setPaletteOpen(false)
  }

  const openByTitle = (ref: string) => {
    const trimmed = ref.trim()
    if (!trimmed) return
    if (notesMap[trimmed]) {
      openNote(trimmed)
      return
    }
    const lower = trimmed.toLowerCase()
    const direct = notes.find((n) => n.title.toLowerCase() === lower)
    if (direct) {
      openNote(direct.id)
      return
    }
    const alias = ALIASES[lower]
    if (alias) {
      openNote(alias)
      return
    }
    const partial = notes.find(
      (n) =>
        n.title.toLowerCase().includes(lower) ||
        lower.includes(n.title.toLowerCase()),
    )
    if (partial) {
      openNote(partial.id)
      return
    }
    openNote('second-brain')
  }

  const createNote = () => {
    noteCounter.current += 1
    const n = noteCounter.current
    const id = `untitled-${n}`
    const title = n === 1 ? 'Untitled Note' : `Untitled Note ${n}`
    const fresh = emptyNote(id, title)
    setNotesMap((prev) => ({ ...prev, [id]: fresh }))
    setTabs((prev) => [...prev, id])
    setActiveTabId(id)
    setView({ kind: 'note' })
    setActiveNav('home')
    setPaletteOpen(false)
  }

  const createFolder = () => {
    folderCounter.current += 1
    const n = folderCounter.current
    const id = `folder-custom-${n}`
    setTree((prev) => [
      ...prev,
      {
        id,
        name: n === 1 ? 'New Folder' : `New Folder ${n}`,
        kind: 'folder',
        children: [],
      },
    ])
    setPaletteOpen(false)
  }

  const updateNoteContent = (id: string, html: string) => {
    setNotesMap((prev) =>
      prev[id] ? { ...prev, [id]: { ...prev[id], content: html } } : prev,
    )
  }

  /* --------------------------- navigation -------------------------- */

  const selectTab = (id: string) => {
    setActiveTabId(id)
    setView({ kind: 'note' })
    setActiveNav('home')
  }

  const openGraph = () => {
    setView({ kind: 'graph' })
    setActiveNav('graph')
    setPaletteOpen(false)
  }

  const openSettings = () => {
    setView({ kind: 'settings' })
    setActiveNav('settings')
    setPaletteOpen(false)
  }

  const goHome = () => {
    setView({ kind: 'note' })
    setActiveNav('home')
  }

  const handleNav = (id: NavId) => {
    setPaletteOpen(false)
    switch (id) {
      case 'home':
        setActiveNav('home')
        setView({ kind: 'note' })
        break
      case 'all':
        setActiveNav('all')
        setView({ kind: 'list', title: 'All Notes', filter: 'all' })
        break
      case 'favorites':
        setActiveNav('favorites')
        setView({ kind: 'list', title: 'Favorites', filter: 'favorites' })
        break
      case 'recent':
        setActiveNav('recent')
        setView({ kind: 'list', title: 'Recent', filter: 'recent' })
        break
      case 'graph':
        openGraph()
        break
      case 'daily':
        openNote('daily-notes')
        setActiveNav('daily')
        break
      case 'settings':
        openSettings()
        break
    }
  }

  const focusMode = () => {
    const hidden = !leftOpen && !rightOpen
    setLeftOpen(!hidden)
    setRightOpen(!hidden)
  }

  /* --------------------------- formatting -------------------------- */

  const format = (action: FormatAction) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    switch (action) {
      case 'scroll-top':
        el.closest<HTMLElement>('[data-editor-scroll]')?.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
        break
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
      case 'link': {
        const selection = window.getSelection()
        if (selection && selection.toString().length > 0) {
          document.execCommand('createLink', false, 'https://nexus.local')
        } else {
          document.execCommand(
            'insertHTML',
            false,
            '<a href="https://nexus.local">link</a>',
          )
        }
        break
      }
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
    updateNoteContent(activeTabId, el.innerHTML)
  }

  /* --------------------- command palette actions ------------------- */

  const filteredCommands = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase()
    return q
      ? COMMANDS.filter((c) => c.label.toLowerCase().includes(q))
      : COMMANDS
  }, [paletteQuery])

  const executeCommand = (id: CommandId) => {
    setPaletteOpen(false)
    switch (id) {
      case 'new-note':
        createNote()
        break
      case 'search-notes':
        setRightOpen(true)
        window.setTimeout(() => searchInputRef.current?.focus(), 80)
        break
      case 'graph-view':
        openGraph()
        break
      case 'new-folder':
        createFolder()
        break
      case 'settings':
        openSettings()
        break
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('palette') === '1') setPaletteOpen(true)
  }, [])

  useEffect(() => {
    setPaletteQuery('')
    setPaletteIndex(0)
  }, [paletteOpen])

  useEffect(() => {
    setPaletteIndex((i) => clampIndex(i, filteredCommands.length))
  }, [filteredCommands.length])

  /* --------------------------- shortcuts --------------------------- */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (mod && !e.shiftKey && key === 'p') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        return
      }
      if (mod && !e.shiftKey && key === 'n') {
        e.preventDefault()
        createNote()
        return
      }
      if (mod && e.shiftKey && key === 'n') {
        e.preventDefault()
        createFolder()
        return
      }
      if (mod && e.shiftKey && key === 'g') {
        e.preventDefault()
        openGraph()
        return
      }
      if (mod && key === ',') {
        e.preventDefault()
        openSettings()
        return
      }
      if (mod && key === 'f') {
        e.preventDefault()
        setRightOpen(true)
        window.setTimeout(() => searchInputRef.current?.focus(), 60)
        return
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ----------------------------- render ---------------------------- */

  const tabInfos: TabInfo[] = tabs.map((id) => ({
    id,
    title: notesMap[id]?.title ?? id,
    icon: notesMap[id]?.icon ?? 'plain',
  }))

  const settings = {
    leftOpen,
    rightOpen,
    showPaletteHint,
    showModified,
    onToggleLeft: () => setLeftOpen((v) => !v),
    onToggleRight: () => setRightOpen((v) => !v),
    onTogglePaletteHint: () => setShowPaletteHint((v) => !v),
    onToggleShowModified: () => setShowModified((v) => !v),
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-win text-ink">
      <TitleBar
        tabs={tabInfos}
        activeTabId={activeTabId}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        paletteHintVisible={showPaletteHint}
        onSelectTab={selectTab}
        onNewTab={createNote}
        onToggleLeft={() => setLeftOpen((v) => !v)}
        onToggleRight={() => setRightOpen((v) => !v)}
        onOpenPalette={() => setPaletteOpen((v) => !v)}
      />

      <div className="flex min-h-0 flex-1">
        <div
          data-sidebar="left"
          className="shrink-0 overflow-hidden border-r border-line transition-[width] duration-200"
          style={{ width: leftOpen ? 244 : 0 }}
        >
          <div className="h-full w-[244px]">
            <LeftSidebar
              activeNav={activeNav}
              tree={tree}
              foldersOpen={foldersOpen}
              onNav={handleNav}
              onToggleFolder={(id) =>
                setFoldersOpen((prev) => ({ ...prev, [id]: !prev[id] }))
              }
              onOpenNote={openNote}
              onOpenGraph={openGraph}
              onOpenSettings={openSettings}
              onOpenMenu={() => setPaletteOpen(true)}
            />
          </div>
        </div>

        <MainPane
          view={view}
          note={activeNote}
          notes={notes}
          editorRef={editorRef}
          showModified={showModified}
          settings={settings}
          onOpenNote={openNote}
          onOpenByTitle={openByTitle}
          onHome={goHome}
          onFormat={format}
          onOpenPalette={() => setPaletteOpen((v) => !v)}
          onSettings={openSettings}
          onGraph={openGraph}
          onFocusMode={focusMode}
          onContentChange={updateNoteContent}
        />

        <div
          data-sidebar="right"
          className="shrink-0 overflow-hidden transition-[width] duration-200"
          style={{ width: rightOpen ? 280 : 0 }}
        >
          <div className="h-full w-[280px]">
            <RightSidebar
              meta={activeNote.meta}
              notes={notes}
              searchQuery={searchQuery}
              searchInputRef={searchInputRef}
              onSearchChange={setSearchQuery}
              onOpenNote={openNote}
              onOpenByTitle={openByTitle}
              onOpenPalette={() => setPaletteOpen(true)}
            />
          </div>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        query={paletteQuery}
        selectedIndex={paletteIndex}
        commands={filteredCommands}
        onQueryChange={setPaletteQuery}
        onSelectedIndexChange={setPaletteIndex}
        onClose={() => setPaletteOpen(false)}
        onExecute={executeCommand}
      />
    </div>
  )
}
