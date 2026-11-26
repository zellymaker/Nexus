/**
 * Settings view for NEXUS — eight sections in a two-column layout: a sticky
 * vertical navigation on the left, the section content on the right.
 *
 * Integration contract (owned by `src/settings/**`, rendered by MainPane):
 *
 *   <SettingsView section={section} onSectionChange={setSection} />
 *
 * The parent already provides the scrollable container and the page heading,
 * so this view must not create its own full-height scroll area: it uses
 * `min-h-full` and lets the parent scroll.
 */
import './messages'
import type { JSX } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  FolderTree,
  Info,
  Keyboard,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  SquarePen,
  Type,
} from 'lucide-react'
import type { SettingsSection } from '../lib/store'
import { useT } from '../lib/i18n'
import { SectionHeader } from './widgets'
import { AboutSection } from './sections/About'
import { AppearanceSection } from './sections/Appearance'
import { EditorSection } from './sections/Editor'
import { GeneralSection } from './sections/General'
import { PrivacySection } from './sections/Privacy'
import { ShortcutsSection } from './sections/Shortcuts'
import { TypographySection } from './sections/Typography'
import { WorkspaceSection } from './sections/Workspace'

interface SectionMeta {
  id: SettingsSection
  icon: LucideIcon
  labelKey: string
  label: string
  descKey: string
  desc: string
}

const SECTIONS: SectionMeta[] = [
  {
    id: 'general',
    icon: SlidersHorizontal,
    labelKey: 'settings.tabs.general',
    label: 'General',
    descKey: 'settings.desc.general',
    desc: 'Language, saving, startup and notifications',
  },
  {
    id: 'appearance',
    icon: Palette,
    labelKey: 'settings.tabs.appearance',
    label: 'Appearance',
    descKey: 'settings.desc.appearance',
    desc: 'Theme, scale, density and motion',
  },
  {
    id: 'typography',
    icon: Type,
    labelKey: 'settings.tabs.typography',
    label: 'Typography',
    descKey: 'settings.desc.typography',
    desc: 'Interface fonts and type scale',
  },
  {
    id: 'editor',
    icon: SquarePen,
    labelKey: 'settings.tabs.editor',
    label: 'Editor',
    descKey: 'settings.desc.editor',
    desc: 'How the note editor looks and behaves',
  },
  {
    id: 'workspace',
    icon: FolderTree,
    labelKey: 'settings.tabs.workspace',
    label: 'Workspace',
    descKey: 'settings.desc.workspace',
    desc: 'Explorer sorting, visibility and Canvas',
  },
  {
    id: 'privacy',
    icon: ShieldCheck,
    labelKey: 'settings.tabs.privacy',
    label: 'Privacy & Security',
    descKey: 'settings.desc.privacy',
    desc: 'Local data, diagnostics and backups',
  },
  {
    id: 'shortcuts',
    icon: Keyboard,
    labelKey: 'settings.tabs.shortcuts',
    label: 'Shortcuts',
    descKey: 'settings.desc.shortcuts',
    desc: 'Keyboard combinations and conflicts',
  },
  {
    id: 'about',
    icon: Info,
    labelKey: 'settings.tabs.about',
    label: 'About',
    descKey: 'settings.desc.about',
    desc: 'Version, stack and licences',
  },
]

function renderSection(section: SettingsSection): JSX.Element {
  switch (section) {
    case 'general':
      return <GeneralSection />
    case 'appearance':
      return <AppearanceSection />
    case 'typography':
      return <TypographySection />
    case 'editor':
      return <EditorSection />
    case 'workspace':
      return <WorkspaceSection />
    case 'privacy':
      return <PrivacySection />
    case 'shortcuts':
      return <ShortcutsSection />
    case 'about':
      return <AboutSection />
  }
}

export function SettingsView({
  section,
  onSectionChange,
}: {
  section: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}): JSX.Element {
  const t = useT()
  const meta = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0]
  const Icon = meta.icon

  return (
    <div className="flex min-h-full w-full items-start gap-[24px]">
      <nav
        aria-label={t('settings.sectionNav', 'Settings sections')}
        className="sticky top-0 w-[200px] shrink-0 self-start pt-1"
      >
        <div className="flex flex-col gap-[2px]">
          {SECTIONS.map((item) => {
            const active = item.id === section
            const ItemIcon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                aria-current={active ? 'page' : undefined}
                title={t(item.labelKey, item.label)}
                className={`group flex h-[32px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors ${
                  active
                    ? 'bg-elevated font-medium text-ink'
                    : 'text-ink-dim hover:bg-hover hover:text-ink'
                }`}
              >
                <ItemIcon
                  size={15.5}
                  strokeWidth={1.8}
                  className={
                    active
                      ? 'shrink-0 text-accent-bright'
                      : 'shrink-0 text-ink-mute group-hover:text-ink-dim'
                  }
                />
                <span className="truncate">{t(item.labelKey, item.label)}</span>
                {active && <span className="ml-auto h-[5px] w-[5px] rounded-full bg-accent" />}
              </button>
            )
          })}
        </div>
        <div className="mt-5 border-t border-line px-2.5 pt-3 text-[11px] leading-[1.6] text-ink-faint">
          <p className="font-medium text-ink-mute">NEXUS 0.1.0</p>
          <p>Tauri 2.12</p>
        </div>
      </nav>

      <div className="min-w-0 flex-1 pb-24 pt-1">
        <div className="max-w-[720px]">
          <SectionHeader
            icon={<Icon size={17} strokeWidth={1.9} />}
            title={t(meta.labelKey, meta.label)}
            description={t(meta.descKey, meta.desc)}
          />
          {renderSection(section)}
        </div>
      </div>
    </div>
  )
}
