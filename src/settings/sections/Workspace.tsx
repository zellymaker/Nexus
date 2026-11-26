/**
 * Workspace: explorer sorting/visibility behaviour and a Canvas summary.
 *
 * Canvas has no dedicated settings fields in the store (the canvas module owns
 * its own persisted document), so this group only explains where Canvas data
 * lives and offers a shortcut to open it.
 */
import { useMemo } from 'react'
import { SquareArrowOutUpRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, Hint, SettingsGroup } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { Switch } from '../../components/ui/Switch'
import { useT } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { formatBytes, NEXUS_PREFIX, readNexusStorage } from '../utils'

const CANVAS_PREFIX = `${NEXUS_PREFIX}canvas`

export function WorkspaceSection() {
  const t = useT()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const setView = useStore((s) => s.setView)
  const setNav = useStore((s) => s.setNav)
  const workspace = settings.workspace

  const canvasStorage = useMemo(() => {
    const entries = readNexusStorage().entries.filter((entry) =>
      entry.key.startsWith(CANVAS_PREFIX),
    )
    return {
      count: entries.length,
      bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    }
  }, [])

  const sortOptions = [
    { value: 'name' as const, label: t('settings.sort.name', 'By name') },
    { value: 'modified' as const, label: t('settings.sort.modified', 'By modified') },
    { value: 'created' as const, label: t('settings.sort.created', 'By created') },
  ]

  return (
    <>
      <SettingsGroup title={t('settings.group.explorer', 'Explorer')}>
        <Field
          label={t('settings.sortFiles', 'File sorting')}
          description={t('settings.sortFilesHint', 'Order of notes inside folders and lists')}
        >
          <Select
            label={t('settings.sortFiles', 'File sorting')}
            value={workspace.sortFiles}
            options={sortOptions}
            onChange={(value) => updateSettings({ workspace: { sortFiles: value } })}
          />
        </Field>
        <Field
          label={t('settings.sortFolders', 'Folder sorting')}
          description={t('settings.sortFoldersHint', 'Order of folders in the explorer')}
        >
          <Select
            label={t('settings.sortFolders', 'Folder sorting')}
            value={workspace.sortFolders}
            options={sortOptions}
            onChange={(value) => updateSettings({ workspace: { sortFolders: value } })}
          />
        </Field>
        <Field
          label={t('settings.showHidden', 'Show hidden items')}
          description={t('settings.showHiddenHint', 'Show folders and notes with hidden names')}
        >
          <Switch
            label={t('settings.showHidden', 'Show hidden items')}
            checked={workspace.showHidden}
            onChange={(value) => updateSettings({ workspace: { showHidden: value } })}
          />
        </Field>
        <Field
          label={t('settings.expandOnClick', 'Expand folders on click')}
          description={t('settings.expandOnClickHint', 'A single click on a folder expands it')}
        >
          <Switch
            label={t('settings.expandOnClick', 'Expand folders on click')}
            checked={workspace.expandOnClick}
            onChange={(value) => updateSettings({ workspace: { expandOnClick: value } })}
          />
        </Field>
        <Field
          label={t('settings.revealActive', 'Reveal active note')}
          description={t('settings.revealActiveHint', 'Scroll the explorer to the open note')}
        >
          <Switch
            label={t('settings.revealActive', 'Reveal active note')}
            checked={workspace.revealActive}
            onChange={(value) => updateSettings({ workspace: { revealActive: value } })}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.behavior', 'Behaviour')}>
        <Field
          label={t('settings.confirmDelete', 'Confirm before deleting')}
          description={t(
            'settings.confirmDeleteHint',
            'Ask for confirmation before deleting notes and folders',
          )}
        >
          <Switch
            label={t('settings.confirmDelete', 'Confirm before deleting')}
            checked={workspace.confirmDelete}
            onChange={(value) => updateSettings({ workspace: { confirmDelete: value } })}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.canvas', 'Canvas')}>
        <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
          <p className="text-[12.5px] leading-[1.55] text-ink-mute">
            {t(
              'settings.canvasInfo',
              'Canvas is saved automatically to local storage. It has no separate settings yet — it uses the current theme, fonts and interface scale.',
            )}
          </p>
          <p className="mt-1.5 font-mono text-[11.5px] text-ink-faint">
            {t('settings.canvasKey', 'Storage key: nexus:canvas:v1')}
          </p>
          {canvasStorage.count > 0 && (
            <p className="mt-1 text-[11.5px] text-ink-mute">
              {t('settings.storageUsed', 'Stored locally')}: {formatBytes(canvasStorage.bytes)}
            </p>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <Hint>
            {t(
              'settings.canvasHint',
              'Canvas keyboard shortcuts are listed under Keyboard shortcuts.',
            )}
          </Hint>
          <Button
            variant="secondary"
            onClick={() => {
              setView({ kind: 'canvas' })
              setNav('canvas')
            }}
          >
            <SquareArrowOutUpRight size={14} strokeWidth={1.9} />
            {t('settings.openCanvas', 'Open Canvas')}
          </Button>
        </div>
      </SettingsGroup>
    </>
  )
}
