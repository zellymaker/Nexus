import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Search, StickyNote, Sprout } from 'lucide-react'
import type { Note, NoteMeta } from '../lib/data'

interface RightSidebarProps {
  meta: NoteMeta
  notes: Note[]
  searchQuery: string
  searchInputRef: RefObject<HTMLInputElement | null>
  onSearchChange: (q: string) => void
  onOpenNote: (noteId: string) => void
  onOpenByTitle: (title: string) => void
  onOpenPalette: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-[11px] text-[15.5px] font-semibold tracking-[-0.005em] text-[#dcdce3]">
      {children}
    </h3>
  )
}

export function RightSidebar({
  meta,
  notes,
  searchQuery,
  searchInputRef,
  onSearchChange,
  onOpenNote,
  onOpenByTitle,
  onOpenPalette,
}: RightSidebarProps) {
  const [searchFocused, setSearchFocused] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setSearchFocused(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const query = searchQuery.trim().toLowerCase()
  const results = query
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.id.toLowerCase().includes(query),
      )
    : []

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-l border-line bg-pane-right">
      <div className="scroll-thin flex-1 overflow-y-auto px-[15px] pb-[26px] pt-[2px]">
        {/* global search */}
        <div ref={wrapRef} className="relative -mx-[7px]">
          <div
            className={`flex h-[38px] items-center gap-[9px] rounded-[9px] border bg-[#26272c] px-[11px] transition-colors ${
              searchFocused
                ? 'border-[#4d4a72]'
                : 'border-white/[0.055]'
            }`}
          >
            <Search size={16} strokeWidth={1.9} className="shrink-0 text-[#8f8f9a]" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  onOpenNote(results[0].id)
                  setSearchFocused(false)
                }
                if (e.key === 'Escape') {
                  onSearchChange('')
                  setSearchFocused(false)
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              placeholder="Global Search"
              aria-label="Global search"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#e4e4ea] outline-none placeholder:text-[#8b8b95]"
            />
            <button
              type="button"
              onClick={onOpenPalette}
              title="Open command palette (Ctrl+P)"
              className="shrink-0 rounded-[5px] bg-[#2f3038] px-[6px] py-[2px] text-[10.5px] font-medium text-[#a9a9b3] transition-colors hover:bg-[#383941] hover:text-[#d5d5dc]"
            >
              Ctrl + P
            </button>
          </div>

          {searchFocused && query.length > 0 && (
            <div className="absolute left-0 right-0 top-[42px] z-30 overflow-hidden rounded-[9px] border border-white/[0.07] bg-[#26262d] shadow-palette">
              {results.length === 0 ? (
                <p className="px-[12px] py-[10px] text-[13px] text-[#8b8b95]">
                  No notes found
                </p>
              ) : (
                results.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      onOpenNote(n.id)
                      setSearchFocused(false)
                    }}
                    className="flex w-full flex-col items-start gap-[1px] px-[12px] py-[7px] text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="text-[13.5px] text-[#e0e0e6]">{n.title}</span>
                    <span className="text-[11.5px] text-[#84848e]">
                      {n.meta.breadcrumbs.join(' / ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* backlinks */}
        <section className="mt-[18px]">
          <SectionTitle>Backlinks</SectionTitle>
          <div className="flex flex-col gap-[6px]">
            {meta.backlinks.map((label, i) => {
              const Icon = i === 1 ? Sprout : StickyNote
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onOpenByTitle(label)}
                  className="flex h-[33px] w-full items-center gap-[9px] rounded-[8px] bg-[#232329] px-[11px] text-left text-[14px] text-[#d2d2da] transition-colors hover:bg-[#282830] hover:text-[#e8e8ee]"
                >
                  <Icon
                    size={15}
                    strokeWidth={1.7}
                    className="shrink-0 text-[#93939d]"
                  />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
            {meta.backlinks.length === 0 && (
              <p className="text-[12.5px] text-[#7d7d87]">No backlinks yet</p>
            )}
          </div>
        </section>

        {/* related */}
        <section className="mt-[24px]">
          <SectionTitle>Related Notes</SectionTitle>
          <div className="flex flex-col gap-[6px]">
            {meta.related.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => onOpenByTitle(label)}
                className="flex h-[33px] w-full items-center rounded-[8px] bg-[#232329] px-[11px] text-left text-[14px] text-[#d2d2da] transition-colors hover:bg-[#282830] hover:text-[#e8e8ee]"
              >
                <span className="truncate">{label}</span>
              </button>
            ))}
            {meta.related.length === 0 && (
              <p className="text-[12.5px] text-[#7d7d87]">Nothing related yet</p>
            )}
          </div>
        </section>

        {/* tags */}
        <section className="mt-[24px]">
          <SectionTitle>Tags</SectionTitle>
          <div className="flex flex-wrap gap-[6px]">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="cursor-default rounded-[7px] bg-[#2c2e34] px-[9px] py-[4px] text-[13px] text-[#cbCbd4] transition-colors hover:bg-[#33353c]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* document properties */}
        <section className="mt-[26px]">
          <SectionTitle>Document Properties</SectionTitle>

          <div className="grid grid-cols-[1fr_1fr] gap-y-[7px]">
            {meta.properties.map((p) => (
              <div key={p.label} className="contents">
                <span className="text-[14px] text-[#8f8f99]">{p.label}</span>
                <span className="text-[14px] text-[#dcDCE3]">{p.value}</span>
              </div>
            ))}
          </div>

          <dl className="mt-[20px] flex flex-col gap-[20px]">
            <div>
              <dt className="text-[13px] text-[#83838d]">Created Date</dt>
              <dd className="mt-[3px] text-[14px] text-[#d8d8df]">{meta.created}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#83838d]">Modified Date</dt>
              <dd className="mt-[3px] text-[14px] text-[#d8d8df]">
                {meta.modifiedDate}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#83838d]">Word count</dt>
              <dd className="mt-[3px] text-[14px] text-[#d8d8df]">
                {meta.wordCount}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </aside>
  )
}
