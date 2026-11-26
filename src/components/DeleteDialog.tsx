import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { ConfirmDialog } from './ui/Modal'
import { Switch } from './ui/Switch'

/**
 * Confirmation dialog for deletions. For folders it lets the user choose
 * whether the contents are deleted with the folder or hoisted one level up.
 * "Don't ask again" writes the workspace setting.
 */
export function DeleteDialog() {
  const dialog = useStore((s) => s.deleteDialog)
  const nodes = useStore((s) => s.nodes)
  const confirmDelete = useStore((s) => s.confirmDelete)
  const cancelDelete = useStore((s) => s.cancelDelete)
  const updateSettings = useStore((s) => s.updateSettings)
  const t = useT()

  const [mode, setMode] = useState<'cascade' | 'hoist'>('cascade')
  const [dontAsk, setDontAsk] = useState(false)

  useEffect(() => {
    if (dialog) {
      setMode('cascade')
      setDontAsk(false)
    }
  }, [dialog])

  if (!dialog) return null

  const ids = dialog.ids.filter((id) => nodes[id])
  const folders = ids.filter((id) => nodes[id]?.kind === 'folder')
  const notes = ids.filter((id) => nodes[id]?.kind === 'note')
  const folderWithChildren = folders.find((id) => (nodes[id]?.childIds.length ?? 0) > 0)
  const single = ids.length === 1 ? nodes[ids[0]] : undefined

  const title = single
    ? t('delete.titleOne', 'Delete “{name}”?').replace('{name}', single.name)
    : t('delete.title', 'Delete items?')

  const description = single
    ? single.kind === 'folder'
      ? t('delete.confirmFolder', 'The folder “{name}” and everything inside will be deleted. You can undo this.').replace(
          '{name}',
          single.name,
        )
      : t('delete.titleOne', 'Delete “{name}”?').replace('{name}', single.name)
    : t('delete.confirmMulti', 'Delete {count} items? You can undo this.').replace(
        '{count}',
        String(ids.length),
      )

  return (
    <ConfirmDialog
      open
      danger
      title={title}
      description={description}
      confirmLabel={t('delete.confirm', 'Delete')}
      cancelLabel={t('common.cancel', 'Cancel')}
      onConfirm={() => {
        if (dontAsk) updateSettings({ workspace: { confirmDelete: false } })
        confirmDelete(mode)
      }}
      onCancel={cancelDelete}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] text-ink-mute">
          {notes.length} notes · {folders.length} folders
        </p>

        {folderWithChildren && (
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-ink-soft">
              {t('delete.folderMode', 'What should happen to the folder contents?')}
            </p>
            <div className="flex flex-col gap-1.5">
              <ModeOption
                checked={mode === 'cascade'}
                onChange={() => setMode('cascade')}
                label={t('delete.mode.cascade', 'Delete the folder and its contents')}
              />
              <ModeOption
                checked={mode === 'hoist'}
                onChange={() => setMode('hoist')}
                label={t('delete.mode.hoist', 'Delete the folder, move contents up one level')}
              />
            </div>
          </div>
        )}

        <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2">
          <span className="text-[12.5px] text-ink-soft">
            {t('delete.dontAsk', "Don't ask again when deleting")}
          </span>
          <Switch
            checked={dontAsk}
            onChange={setDontAsk}
            label={t('delete.dontAsk', "Don't ask again when deleting")}
          />
        </label>
      </div>
    </ConfirmDialog>
  )
}

function ModeOption({
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
      onClick={onChange}
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors ${
        checked
          ? 'border-accent/40 bg-accent/10 text-ink'
          : 'border-line bg-surface-2 text-ink-soft hover:bg-hover'
      }`}
    >
      <span
        className={`grid h-[14px] w-[14px] shrink-0 place-items-center rounded-full border ${
          checked ? 'border-accent bg-accent' : 'border-line-strong'
        }`}
      >
        {checked && <span className="h-[5px] w-[5px] rounded-full bg-white" />}
      </span>
      {label}
    </button>
  )
}

