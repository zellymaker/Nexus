import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Sprout, StickyNote } from 'lucide-react'
import {
  getBacklinks,
  getRelated,
  useStore,
} from '../lib/store'
import { useT } from '../lib/i18n'
import { formatDateTime, formatRelative, wordCountLabel } from '../lib/format'
import { Select } from './ui/Select'
import { useBindings } from '../lib/store'
import { formatBinding } from '../lib/shortcuts'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-[11px] text-[15.5px] font-semibold tracking-[-0.005em] text-ink">{children}</h3>
  )
}

const STATUS_OPTIONS = ['Draft', 'In Progress', 'Planned', 'Active', 'Archived'] as const
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'] as const

/** Right sidebar: global search, links, tags and document properties. */
export function RightSidebar() {
  const nodes = useStore((s) => s.nodes)
  const activeTabId = useStore((s) => s.activeTabId)
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const openNote = useStore((s) => s.openNote)
  const setRightOpen = useStore((s) => s.setRightOpen)
  const setPaletteOpen = useStore((s) => s.setPaletteOpen)
  const updateNoteMeta = useStore((s) => s.updateNoteMeta)
  const language = useStore((s) => s.settings.language)
  const bindings = useBindings()
  const t = useT()

  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  const node = nodes[activeTabId]
  const meta = node?.meta ?? { tags: [], status: 'Draft', priority: 'Low' }

  useEffect(() => {
    const focus = () => {
      setRightOpen(true)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
    window.addEventListener('nexus:focus-search', focus)
    return () => window.removeEventListener('nexus:focus-search', focus)
  }, [setRightOpen])

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const backlinks = useMemo(() => (node ? getBacklinks(nodes, node.id) : []), [nodes, node])
  const related = useMemo(() => (node ? getRelated(nodes, node.id) : []), [nodes, node])

  const query = searchQuery.trim().toLowerCase()
  const results = useMemo(() => {
    if (!query) return []
    return Object.values(nodes)
      .filter((n) => n.kind === 'note')
      .filter((n) => {
        if (n.name.toLowerCase().includes(query)) return true
        const text = (n.content ?? '').replace(/<[^>]*>/g, ' ').toLowerCase()
        return text.includes(query)
      })
      .slice(0, 6)
  }, [nodes, query])


  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-l border-line bg-side-right">
      <div className="scroll-thin flex-1 overflow-y-auto px-[15px] pb-[26px] pt-[2px]">
        {/* global search */}
        <div ref={wrapRef} className="relative -mx-[7px]">
          <div
            className={`flex h-[38px] items-center gap-[9px] rounded-[9px] border bg-input px-[11px] transition-colors ${
              focused ? 'border-accent-soft/70' : 'border-line'
            }`}
          >
            <Search size={16} strokeWidth={1.9} className="shrink-0 text-ink-dim" />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) {
                  openNote(results[0].id)
                  setFocused(false)
                }
                if (event.key === 'Escape') {
                  setSearchQuery('')
                  setFocused(false)
                  event.currentTarget.blur()
                }
              }}
              placeholder={t('search.globalPlaceholder', 'Global Search')}
              aria-label={t('search.globalPlaceholder', 'Global Search')}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-mute"
            />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              title={t('titlebar.palette', 'Command palette')}
              className="shrink-0 rounded-[5px] bg-surface-3 px-[6px] py-[2px] text-[10.5px] font-medium text-ink-dim transition-colors hover:bg-hover-strong hover:text-ink"
            >
              {formatBinding(bindings['palette'])}
            </button>
          </div>

          {focused && query.length > 0 && (
            <div className="anim-menu-in absolute left-0 right-0 top-[42px] z-30 overflow-hidden rounded-[9px] border border-line bg-surface-2 shadow-menu">
              {results.length === 0 ? (
                <p className="px-[12px] py-[10px] text-[13px] text-ink-mute">
                  {t('search.noResults', 'Nothing found')}
                </p>
              ) : (
                results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      openNote(result.id)
                      setFocused(false)
                    }}
                    className="flex w-full flex-col items-start gap-[1px] px-[12px] py-[7px] text-left transition-colors hover:bg-hover"
                  >
                    <span className="text-[13.5px] text-ink-soft">{result.name}</span>
                    <span className="text-[11.5px] text-ink-mute">
                      {formatRelative(result.updatedAt, t)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* backlinks */}
        <section className="mt-[18px]">
          <SectionTitle>{t('sidebar.backlinks', 'Backlinks')}</SectionTitle>
          <div className="flex flex-col gap-[6px]">
            {backlinks.length === 0 && (
              <p className="text-[12.5px] text-ink-mute">{t('sidebar.noBacklinks', 'No backlinks yet')}</p>
            )}
            {backlinks.map((id, index) => {
              const target = nodes[id]
              if (!target) return null
              const Icon = index === 1 ? Sprout : StickyNote
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openNote(id)}
                  className="flex h-[33px] w-full items-center gap-[9px] rounded-[8px] bg-surface px-[11px] text-left text-[14px] text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink"
                >
                  <Icon size={15} strokeWidth={1.7} className="shrink-0 text-ink-dim" />
                  <span className="truncate">{target.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* related */}
        <section className="mt-[24px]">
          <SectionTitle>{t('sidebar.related', 'Related Notes')}</SectionTitle>
          <div className="flex flex-col gap-[6px]">
            {related.length === 0 && (
              <p className="text-[12.5px] text-ink-mute">{t('sidebar.noRelated', 'Nothing related yet')}</p>
            )}
            {related.map((id) => {
              const target = nodes[id]
              if (!target) return null
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openNote(id)}
                  className="flex h-[33px] w-full items-center rounded-[8px] bg-surface px-[11px] text-left text-[14px] text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink"
                >
                  <span className="truncate">{target.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* tags */}
        <section className="mt-[24px]">
          <SectionTitle>{t('sidebar.tags', 'Tags')}</SectionTitle>
          <div className="flex flex-wrap gap-[6px]">
            {meta.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(tag)
                  setRightOpen(true)
                  window.setTimeout(() => inputRef.current?.focus(), 30)
                }}
                className="rounded-[7px] bg-surface-3 px-[9px] py-[4px] text-[13px] text-ink-soft transition-colors hover:bg-hover-strong hover:text-ink"
              >
                {tag}
              </button>
            ))}
            {meta.tags.length === 0 && <p className="text-[12.5px] text-ink-mute">—</p>}
          </div>
        </section>

        {/* document properties */}
        <section className="mt-[26px]">
          <SectionTitle>{t('sidebar.properties', 'Document Properties')}</SectionTitle>

          <div className="grid grid-cols-[1fr_1fr] items-center gap-y-[7px]">
            <span className="text-[14px] text-ink-dim">{t('sidebar.status', 'Status')}</span>
            <div className="min-w-0">
              <Select
                value={meta.status}
                options={STATUS_OPTIONS.map((value) => ({ value, label: value }))}
                onChange={(value) => node && updateNoteMeta(node.id, { status: value })}
                label={t('sidebar.status', 'Status')}
                className="[&>button]:h-[26px] [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0 [&>button]:text-[13.5px]"
              />
            </div>
            <span className="text-[14px] text-ink-dim">{t('sidebar.priority', 'Priority')}</span>
            <div className="min-w-0">
              <Select
                value={meta.priority}
                options={PRIORITY_OPTIONS.map((value) => ({ value, label: value }))}
                onChange={(value) => node && updateNoteMeta(node.id, { priority: value })}
                label={t('sidebar.priority', 'Priority')}
                className="[&>button]:h-[26px] [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0 [&>button]:text-[13.5px]"
              />
            </div>
          </div>

          <dl className="mt-[20px] flex flex-col gap-[20px]">
            <div>
              <dt className="text-[13px] text-ink-mute">{t('sidebar.created', 'Created Date')}</dt>
              <dd className="mt-[3px] text-[14px] text-ink-soft">
                {node ? formatDateTime(node.createdAt, language) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-mute">{t('sidebar.modified', 'Modified Date')}</dt>
              <dd className="mt-[3px] text-[14px] text-ink-soft">
                {node ? formatDateTime(node.updatedAt, language) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-mute">{t('sidebar.wordCount', 'Word count')}</dt>
              <dd className="mt-[3px] text-[14px] text-ink-soft">{wordCountLabel(node, t)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </aside>
  )
}
