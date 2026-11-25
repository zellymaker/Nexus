import { FileText } from 'lucide-react'
import type { Note } from '../lib/data'
import { GraphPreview } from './GraphPreview'

export interface SettingsProps {
  leftOpen: boolean
  rightOpen: boolean
  showPaletteHint: boolean
  showModified: boolean
  onToggleLeft: () => void
  onToggleRight: () => void
  onTogglePaletteHint: () => void
  onToggleShowModified: () => void
}

/* ------------------------------------------------------------------ */
/*  Note list (All Notes / Favorites / Recent)                         */
/* ------------------------------------------------------------------ */

export function NotesListView({
  notes,
  onOpenNote,
}: {
  notes: Note[]
  onOpenNote: (id: string) => void
}) {
  return (
    <div className="flex max-w-[760px] flex-col gap-[2px]">
      {notes.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => onOpenNote(n.id)}
          className="group flex h-[46px] items-center justify-between gap-4 rounded-[8px] px-[10px] text-left transition-colors hover:bg-white/[0.045]"
        >
          <span className="flex min-w-0 items-center gap-[11px]">
            <FileText
              size={16}
              strokeWidth={1.7}
              className="shrink-0 text-[#8f8f99] group-hover:text-[#b9b9c3]"
            />
            <span className="truncate text-[14.5px] text-[#d4d4dc] group-hover:text-[#ececf1]">
              {n.title}
            </span>
          </span>
          <span className="shrink-0 text-[12px] text-[#7b7b85]">
            {n.meta.modifiedDate}
          </span>
        </button>
      ))}
      {notes.length === 0 && (
        <p className="px-[10px] py-[10px] text-[13.5px] text-[#7b7b85]">
          No notes here yet
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Graph view                                                         */
/* ------------------------------------------------------------------ */

const GRAPH_TARGETS = [
  'second-brain',
  'projects-overview',
  'team-sync',
  'productivity-system',
  'daily-notes',
  'documents',
  'second-brain',
  'productivity-system',
]

export function GraphPage({
  onOpenNote,
}: {
  onOpenNote: (id: string) => void
}) {
  return (
    <div className="h-[520px] w-full max-w-[900px]">
      <GraphPreview
        className="h-full w-full"
        onNodeClick={(index) =>
          onOpenNote(
            index === 8 ? 'second-brain' : (GRAPH_TARGETS[index] ?? 'second-brain'),
          )
        }
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors ${
        checked ? 'bg-[#6f63e8]' : 'bg-[#3a3a43]'
      }`}
    >
      <span
        className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white transition-all ${
          checked ? 'left-[18px]' : 'left-[2px]'
        }`}
      />
    </button>
  )
}

function Row({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-white/[0.05] py-[13px]">
      <div className="min-w-0">
        <p className="text-[14px] text-[#dcdce3]">{label}</p>
        {description && (
          <p className="mt-[2px] text-[12.5px] text-[#7f7f89]">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

export function SettingsPage({
  leftOpen,
  rightOpen,
  showPaletteHint,
  showModified,
  onToggleLeft,
  onToggleRight,
  onTogglePaletteHint,
  onToggleShowModified,
}: SettingsProps) {
  return (
    <div className="max-w-[640px] pb-[40px]">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#7f7f89]">
        Layout
      </h2>
      <div className="mt-[6px] flex flex-col">
        <Row label="Left sidebar" description="Workspace navigation and explorer">
          <Toggle
            checked={leftOpen}
            onChange={onToggleLeft}
            label="Toggle left sidebar"
          />
        </Row>
        <Row label="Right sidebar" description="Context, backlinks and properties">
          <Toggle
            checked={rightOpen}
            onChange={onToggleRight}
            label="Toggle right sidebar"
          />
        </Row>
        <Row label="Command palette hint" description="Show the Ctrl + P badge">
          <Toggle
            checked={showPaletteHint}
            onChange={onTogglePaletteHint}
            label="Toggle command palette hint"
          />
        </Row>
        <Row label="Last modified" description="Show edit time above the document">
          <Toggle
            checked={showModified}
            onChange={onToggleShowModified}
            label="Toggle last modified time"
          />
        </Row>
      </div>

      <h2 className="mt-[28px] text-[13px] font-medium uppercase tracking-[0.08em] text-[#7f7f89]">
        Appearance
      </h2>
      <div className="mt-[6px] flex flex-col">
        <Row label="Theme" description="Interface color scheme">
          <span className="flex items-center gap-[8px] rounded-[7px] bg-[#232329] px-[10px] py-[5px] text-[12.5px] text-[#c9c9d1]">
            <span className="h-[10px] w-[10px] rounded-full bg-[#877ffe]" />
            NEXUS Dark
          </span>
        </Row>
        <Row label="Editor width" description="Measure of the writing column">
          <span className="text-[12.5px] text-[#9b9ba6]">Wide</span>
        </Row>
      </div>

      <h2 className="mt-[28px] text-[13px] font-medium uppercase tracking-[0.08em] text-[#7f7f89]">
        About
      </h2>
      <div className="mt-[6px] flex flex-col">
        <Row label="Version">
          <span className="text-[12.5px] text-[#9b9ba6]">0.1.0</span>
        </Row>
        <Row label="Built with">
          <span className="text-[12.5px] text-[#9b9ba6]">
            Tauri 2 · React · Tailwind
          </span>
        </Row>
      </div>
    </div>
  )
}
