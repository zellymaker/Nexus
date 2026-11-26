/**
 * Privacy & Security: what NEXUS stores locally, diagnostics, JSON backup
 * export/import, application permissions and temporary-data cleanup.
 *
 * Everything in the "privacy" block is a factual description of this build:
 * the app keeps data in `localStorage` only and performs no network requests.
 */
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Check,
  Download,
  Minus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, Hint, SettingsGroup } from '../../components/ui/Field'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Switch } from '../../components/ui/Switch'
import { useT } from '../../lib/i18n'
import { flushPersistence, useStore } from '../../lib/store'
import {
  MAX_BACKUP_BYTES,
  applyBackup,
  downloadBackup,
  fill,
  formatBytes,
  formatTime,
  parseBackup,
  readNexusStorage,
  sanitizeBackup,
} from '../utils'
import type { ParsedBackup, StorageInfo } from '../utils'

type PermissionTone = 'ok' | 'partial' | 'no'

function PermissionRow({
  label,
  value,
  tone,
  note,
}: {
  label: string
  value: string
  tone: PermissionTone
  note?: string
}) {
  const icon =
    tone === 'ok' ? <Check size={12} strokeWidth={2.6} /> : tone === 'partial' ? <Minus size={12} strokeWidth={2.6} /> : <X size={12} strokeWidth={2.6} />
  const toneClass =
    tone === 'ok'
      ? 'bg-surface-3 text-success'
      : tone === 'partial'
        ? 'bg-surface-3 text-warn'
        : 'bg-surface-3 text-danger'
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] text-ink-soft">{label}</p>
        {note && <p className="mt-0.5 text-[11.5px] text-ink-mute">{note}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[12px] text-ink-mute">{value}</span>
        <span className={`grid h-[18px] w-[18px] place-items-center rounded-full ${toneClass}`}>
          {icon}
        </span>
      </div>
    </div>
  )
}

export function PrivacySection() {
  const t = useT()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const setDiagnostics = useStore((s) => s.setDiagnostics)
  const clearDiagnostics = useStore((s) => s.clearDiagnostics)
  const pushToast = useStore((s) => s.pushToast)
  const diagnostics = useStore((s) => s.diagnostics)

  const [storage, setStorage] = useState<StorageInfo>(() => readNexusStorage())
  const [importPending, setImportPending] = useState<ParsedBackup | null>(null)
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [clearTempOpen, setClearTempOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const privacy = settings.privacy

  const refreshStorage = () => setStorage(readNexusStorage())

  useEffect(() => {
    // the persisted store writes are debounced by ~250 ms
    const timer = window.setTimeout(refreshStorage, 400)
    return () => window.clearTimeout(timer)
  }, [])

  const handleExport = () => {
    // make sure the latest (debounced) store writes are part of the backup
    flushPersistence()
    const count = downloadBackup()
    pushToast({
      title: t('settings.backupExported', 'Backup saved'),
      message: fill(t('settings.backupKeys', 'Keys: {n}'), { n: count }),
      tone: 'success',
    })
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    setImportWarnings([])
    if (file.size > MAX_BACKUP_BYTES) {
      setImportError(
        fill(
          t(
            'settings.backupTooLarge',
            'Backup is too large: {size}. Maximum is 50 MB.',
          ),
          { size: formatBytes(file.size) },
        ),
      )
      return
    }
    try {
      const raw = await file.text()
      const parsed = parseBackup(raw)
      if (!parsed) {
        setImportError(t('settings.backupInvalid', 'This file is not a NEXUS backup'))
        return
      }
      const sanitized = sanitizeBackup(parsed.keys)
      if (!sanitized) {
        setImportError(
          t(
            'settings.backupInvalidStore',
            'The backup contains corrupted workspace or canvas data',
          ),
        )
        return
      }
      if (Object.keys(sanitized.keys).length === 0) {
        setImportError(
          t('settings.backupEmpty', 'This backup has no importable data'),
        )
        return
      }
      setImportError(null)
      const warnings: string[] = []
      if (sanitized.skippedCanvas) {
        warnings.push(
          t(
            'settings.backupCanvasSkipped',
            'The Canvas data in this backup is corrupted and will not be imported — the current canvas stays unchanged.',
          ),
        )
      }
      if (sanitized.sanitizedNotes > 0 || sanitized.adjustedSettings > 0) {
        warnings.push(
          fill(
            t(
              'settings.backupSanitizedInfo',
              'Unsafe note markup was cleaned: {notes}. Settings corrected: {adjusted}.',
            ),
            {
              notes: sanitized.sanitizedNotes,
              adjusted: sanitized.adjustedSettings,
            },
          ),
        )
      }
      setImportWarnings(warnings)
      setImportPending({ keys: sanitized.keys, count: Object.keys(sanitized.keys).length })
    } catch (error) {
      setImportError(
        fill(t('settings.backupImportFailed', 'Could not read the file: {message}'), {
          message: error instanceof Error ? error.message : String(error),
        }),
      )
    }
  }

  const handleImportConfirm = () => {
    if (!importPending) return
    // flush pending store writes first, otherwise they would overwrite the
    // imported snapshot during the page unload
    flushPersistence()
    const ok = applyBackup(importPending.keys)
    setImportPending(null)
    if (!ok) {
      pushToast({
        title: fill(t('settings.backupImportFailed', 'Could not read the file: {message}'), {
          message: 'localStorage',
        }),
        tone: 'danger',
      })
      return
    }
    window.location.reload()
  }

  const handleClearDiagnostics = () => {
    clearDiagnostics()
    pushToast({ title: t('settings.diagnosticsCleared', 'Diagnostics cleared'), tone: 'default' })
  }

  const handleClearTemporary = () => {
    const { toasts, dismissToast } = useStore.getState()
    for (const toast of toasts) dismissToast(toast.id)
    clearDiagnostics()
    setClearTempOpen(false)
    pushToast({ title: t('settings.clearTempDone', 'Temporary data cleared'), tone: 'success' })
  }

  return (
    <>
      <SettingsGroup title={t('settings.group.storage', 'Local storage')}>
        <div className="flex items-center justify-between gap-4 border-b border-line py-3">
          <div className="min-w-0">
            <p className="text-[13.5px] text-ink-soft">
              {t('settings.storageSize', 'Used in localStorage')}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-mute">
              {fill(t('settings.storageKeysLabel', 'NEXUS keys: {n}'), {
                n: storage.entries.length,
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="tabular rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[12px] text-ink-soft">
              {formatBytes(storage.totalBytes)}
            </span>
            <Button size="sm" variant="ghost" onClick={refreshStorage}>
              <RefreshCw size={13} strokeWidth={1.9} />
              {t('settings.storageRefresh', 'Refresh')}
            </Button>
          </div>
        </div>

        {storage.entries.length > 0 ? (
          <ul className="scroll-thin mt-2.5 max-h-[150px] overflow-y-auto rounded-lg border border-line bg-surface-2 p-1.5">
            {storage.entries.map((entry) => (
              <li
                key={entry.key}
                className="flex items-center justify-between gap-3 rounded px-1.5 py-1 text-[11.5px]"
              >
                <span className="min-w-0 truncate font-mono text-ink-mute">{entry.key}</span>
                <span className="tabular shrink-0 text-ink-faint">{formatBytes(entry.bytes)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2.5 text-[12px] text-ink-mute">
            {t('settings.storageEmpty', 'No data yet')}
          </p>
        )}

        <div className="mt-2.5">
          <Hint>
            <span className="block">{t('settings.localStorageHint', 'All NEXUS data is stored only on this computer')}</span>
            <span className="mt-1 block">
              {t(
                'settings.storagePrivacyNote',
                'All NEXUS data lives in this application’s local storage on this computer.',
              )}
            </span>
          </Hint>
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.privacy', 'Privacy')}>
        <div className="flex items-start gap-3 border-b border-line py-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-3 text-success">
            <ShieldCheck size={15} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-ink-soft">
              {t('settings.noTelemetry', 'No telemetry or analytics')}
            </p>
            <p className="mt-0.5 text-[12px] leading-[1.45] text-ink-mute">
              {t(
                'settings.noTelemetryDesc',
                'NEXUS does not collect or send telemetry, analytics or usage reports.',
              )}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 py-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-3 text-success">
            <Check size={15} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-ink-soft">
              {t('settings.noNetwork', 'Document content is never sent over the network')}
            </p>
            <p className="mt-0.5 text-[12px] leading-[1.45] text-ink-mute">
              {t(
                'settings.noNetworkDesc',
                'Note content, settings and Canvas data never leave this computer.',
              )}
            </p>
          </div>
        </div>
        <Hint>
          {t(
            'settings.localStorageDesc',
            'Notes, settings and Canvas are stored in WebView localStorage under nexus: keys',
          )}
        </Hint>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.diagnostics', 'Diagnostics')}>
        <Field
          label={t('settings.diagnostics', 'Local diagnostics')}
          description={t(
            'settings.diagnosticsHint',
            'Errors are kept in memory for this session only',
          )}
        >
          <Switch
            label={t('settings.diagnostics', 'Local diagnostics')}
            checked={privacy.diagnostics}
            onChange={(value) => setDiagnostics(value)}
          />
        </Field>
        <Field
          label={t('settings.diagnosticsPaths', 'Include paths in diagnostics')}
          description={t(
            'settings.diagnosticsPathsHint',
            'Add paths and identifiers to the log entries (off by default)',
          )}
        >
          <Switch
            label={t('settings.diagnosticsPaths', 'Include paths in diagnostics')}
            checked={privacy.diagnosticsPaths}
            disabled={!privacy.diagnostics}
            onChange={(value) => updateSettings({ privacy: { diagnosticsPaths: value } })}
          />
        </Field>

        <div className="flex items-center justify-between gap-4 border-b border-line py-3">
          <p className="text-[12.5px] text-ink-mute">
            {fill(t('settings.diagnosticsCount', 'Entries: {n}'), { n: diagnostics.length })}
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={diagnostics.length === 0}
            onClick={handleClearDiagnostics}
          >
            <Trash2 size={13} strokeWidth={1.9} />
            {t('settings.clearDiagnostics', 'Clear diagnostics')}
          </Button>
        </div>

        {!privacy.diagnostics && (
          <p className="mt-3 text-[12px] leading-[1.45] text-ink-mute">
            {t(
              'settings.diagnosticsDisabled',
              'Diagnostics are off — new entries are not collected. Existing entries stay in memory until restart.',
            )}
          </p>
        )}

        {diagnostics.length > 0 ? (
          <ul className="scroll-thin mt-2.5 max-h-[220px] overflow-y-auto rounded-lg border border-line bg-surface-2 p-1.5 font-mono text-[11.5px]">
            {diagnostics
              .slice(-40)
              .reverse()
              .map((entry) => (
                <li key={entry.id} className="flex gap-2 rounded px-1.5 py-1">
                  <span className="tabular shrink-0 text-ink-faint">{formatTime(entry.at)}</span>
                  <span className="min-w-0 break-words text-ink-mute">{entry.message}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-2.5 text-[12px] text-ink-mute">
            {t('settings.diagnosticsEmpty', 'No diagnostics yet')}
          </p>
        )}
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.backup', 'Backups')}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line py-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExport}
            disabled={storage.entries.length === 0}
          >
            <Download size={13} strokeWidth={1.9} />
            {t('settings.backupExport', 'Export to JSON')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={13} strokeWidth={1.9} />
            {t('settings.backupImport', 'Import from JSON')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
            aria-label={t('settings.backupImport', 'Import from JSON')}
          />
        </div>
        <p className="mt-2 text-[12px] leading-[1.45] text-ink-mute">
          {t(
            'settings.backupExportHint',
            'Download all NEXUS data — notes, settings and Canvas — as a single JSON file',
          )}
        </p>
        <p className="mt-1 text-[12px] leading-[1.45] text-ink-mute">
          {t(
            'settings.backupImportHint',
            'Restore data from a backup file. The application will reload.',
          )}
        </p>
        <p className="mt-1 text-[12px] leading-[1.45] text-ink-mute">
          {t(
            'settings.backupLocalOnly',
            'The file is created locally through the Blob API and downloaded to disk — it is never sent anywhere.',
          )}
        </p>
        <p className="mt-1 text-[12px] leading-[1.45] text-ink-mute">
          {t('settings.backupLimit', 'Maximum backup size — 50 MB.')}
        </p>
        {importError && <p className="mt-2 text-[12px] text-danger">{importError}</p>}
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.permissions', 'Application permissions')}>
        <PermissionRow
          label={t('settings.permissions.window', 'Application window')}
          note={t(
            'settings.permissions.windowNote',
            'Window chrome: title, size, maximize and dragging',
          )}
          value={t('settings.permissions.yes', 'Yes')}
          tone="ok"
        />
        <PermissionRow
          label={t('settings.permissions.storage', 'WebView local storage (localStorage)')}
          note={t(
            'settings.permissions.storageNote',
            'Notes, settings and Canvas stay inside WebView local storage',
          )}
          value={t('settings.permissions.yes', 'Yes')}
          tone="ok"
        />
        <PermissionRow
          label={t('settings.permissions.clipboard', 'Clipboard')}
          note={t(
            'settings.permissions.clipboardNote',
            'Write only, on a button press: version info and note links',
          )}
          value={t(
            'settings.permissions.writeOnly',
            'Write only, on user action',
          )}
          tone="partial"
        />
        <PermissionRow
          label={t('settings.permissions.filesystem', 'File system access')}
          note={t(
            'settings.permissions.filesystemNote',
            'No access: backups are saved as a Blob download, not through a file system API',
          )}
          value={t('settings.permissions.no', 'No')}
          tone="no"
        />
        <PermissionRow
          label={t('settings.permissions.network', 'Network requests')}
          note={t(
            'settings.permissions.networkNote',
            'No HTTP requests: notes and settings are never sent anywhere',
          )}
          value={t('settings.permissions.no', 'No')}
          tone="no"
        />
        <PermissionRow
          label={t('settings.permissions.shell', 'Shell and OS commands')}
          note={t('settings.permissions.shellNote', 'No access to processes, shell or OS commands')}
          value={t('settings.permissions.no', 'No')}
          tone="no"
        />
        <PermissionRow
          label={t('settings.permissions.camera', 'Camera and microphone')}
          value={t('settings.permissions.no', 'No')}
          tone="no"
        />
        <PermissionRow
          label={t('settings.permissions.location', 'Geolocation')}
          value={t('settings.permissions.no', 'No')}
          tone="no"
        />
        <p className="mt-2.5 text-[11.5px] leading-[1.5] text-ink-mute">
          {t(
            'settings.permissionsHint',
            'NEXUS uses only the window, WebView local storage and clipboard writes triggered by the user. There is no file system, network or shell access.',
          )}
        </p>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.cleanup', 'Cleanup')}>
        <div className="flex flex-wrap items-center justify-between gap-4 py-1">
          <div className="min-w-0">
            <p className="text-[13.5px] text-ink-soft">
              {t('settings.clearTemp', 'Clear temporary data')}
            </p>
            <p className="mt-0.5 max-w-[400px] text-[12px] leading-[1.45] text-ink-mute">
              {t('settings.clearTempHint', 'Diagnostics entries and all active toasts for this session')}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setClearTempOpen(true)}>
            <Trash2 size={14} strokeWidth={1.9} />
            {t('settings.clearTemp', 'Clear temporary data')}
          </Button>
        </div>
      </SettingsGroup>

      <ConfirmDialog
        open={importPending !== null}
        title={t('settings.backupConfirmTitle', 'Import this backup?')}
        description={
          importPending
            ? fill(
                t(
                  'settings.backupConfirmDesc',
                  'Current NEXUS data will be replaced with data from the file ({n} keys). The application will reload.',
                ),
                { n: importPending.count },
              )
            : undefined
        }
        confirmLabel={t('settings.backupApply', 'Import')}
        cancelLabel={t('common.cancel', 'Cancel')}
        danger
        onConfirm={handleImportConfirm}
        onCancel={() => {
          setImportPending(null)
          setImportWarnings([])
        }}
      >
        {importWarnings.length > 0 && (
          <ul className="space-y-1.5 rounded-lg border border-warn bg-surface-2 px-3 py-2">
            {importWarnings.map((warning) => (
              <li key={warning} className="text-[12px] leading-[1.5] text-warn">
                {warning}
              </li>
            ))}
          </ul>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={clearTempOpen}
        title={t('settings.clearTempTitle', 'Clear temporary data?')}
        description={t(
          'settings.clearTempDesc',
          'Diagnostics entries and active toasts will be removed. Notes, settings and Canvas are untouched.',
        )}
        confirmLabel={t('settings.clearTemp', 'Clear temporary data')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onConfirm={handleClearTemporary}
        onCancel={() => setClearTempOpen(false)}
      />
    </>
  )
}
