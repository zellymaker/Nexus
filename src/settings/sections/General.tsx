/**
 * General settings: language, startup behaviour, autosave, deletion
 * confirmation, notifications and the "reset everything" action.
 */
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Field, SettingsGroup } from '../../components/ui/Field'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Switch } from '../../components/ui/Switch'
import { useT } from '../../lib/i18n'
import { LANGUAGES } from '../../lib/settings'
import { useStore } from '../../lib/store'
import { formatDelay } from '../utils'
import { Segmented } from '../widgets'

const AUTOSAVE_DELAYS = [200, 500, 1000, 2000, 5000]
const TOAST_DURATIONS = [2000, 3000, 4200, 6000, 8000, 0]

export function GeneralSection() {
  const t = useT()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const setLanguage = useStore((s) => s.setLanguage)
  const resetSettings = useStore((s) => s.resetSettings)
  const pushToast = useStore((s) => s.pushToast)
  const [resetOpen, setResetOpen] = useState(false)

  const autosave = settings.workspace.autosave
  const notifications = settings.notifications.toasts

  const handleReset = () => {
    const language = settings.language
    resetSettings()
    setLanguage(language)
    setResetOpen(false)
    pushToast({ title: t('settings.resetDone', 'Settings reset'), tone: 'success' })
  }

  return (
    <>
      <SettingsGroup title={t('settings.group.language', 'Language')}>
        <Field
          label={t('settings.language', 'Language')}
          description={t('settings.languageHint', 'Changes without restart')}
        >
          <Select
            label={t('settings.language', 'Language')}
            value={settings.language}
            options={LANGUAGES}
            onChange={(value) => setLanguage(value)}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.behavior', 'Behaviour')}>
        <Field
          label={t('settings.startup', 'Startup behaviour')}
          description={t(
            'settings.startupHint',
            'Restore session — reopen the previous tabs; Home — start from the home screen',
          )}
        >
          <Segmented
            label={t('settings.startup', 'Startup behaviour')}
            value={settings.workspace.startup}
            onChange={(value) => updateSettings({ workspace: { startup: value } })}
            options={[
              {
                value: 'restore',
                label: t('settings.startup.restore', 'Restore session'),
              },
              { value: 'home', label: t('settings.startup.home', 'Open home') },
            ]}
          />
        </Field>
        <Field
          label={t('settings.confirmDelete', 'Confirm before deleting')}
          description={t(
            'settings.confirmDeleteHint',
            'Ask for confirmation before deleting notes and folders',
          )}
        >
          <Switch
            label={t('settings.confirmDelete', 'Confirm before deleting')}
            checked={settings.workspace.confirmDelete}
            onChange={(value) => updateSettings({ workspace: { confirmDelete: value } })}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.autosave', 'Saving')}>
        <Field
          label={t('settings.autosave', 'Autosave')}
          description={t('settings.autosaveHint', 'Save note changes automatically')}
        >
          <Switch
            label={t('settings.autosave', 'Autosave')}
            checked={autosave}
            onChange={(value) => updateSettings({ workspace: { autosave: value } })}
          />
        </Field>
        <Field
          label={t('settings.autosaveDelay', 'Autosave interval')}
          description={t('settings.autosaveDelayHint', 'Delay after the last edit')}
        >
          <Select
            label={t('settings.autosaveDelay', 'Autosave interval')}
            value={settings.workspace.autosaveDelay}
            disabled={!autosave}
            options={AUTOSAVE_DELAYS.map((value) => ({
              value,
              label: formatDelay(value, t),
            }))}
            onChange={(value) => updateSettings({ workspace: { autosaveDelay: value } })}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.notifications', 'Notifications')}>
        <Field
          label={t('settings.toasts', 'Show notifications')}
          description={t('settings.notificationsHint', 'Show toast notifications for actions')}
        >
          <Switch
            label={t('settings.toasts', 'Show notifications')}
            checked={notifications}
            onChange={(value) => updateSettings({ notifications: { toasts: value } })}
          />
        </Field>
        <Field
          label={t('settings.toastDuration', 'Notification duration')}
          description={t('settings.toastDurationHint', 'How long a toast stays on screen')}
        >
          <Select
            label={t('settings.toastDuration', 'Notification duration')}
            value={settings.notifications.duration}
            disabled={!notifications}
            options={TOAST_DURATIONS.map((value) => ({
              value,
              label:
                value === 0 ? t('settings.durationNever', 'Keep on screen') : formatDelay(value, t),
            }))}
            onChange={(value) => updateSettings({ notifications: { duration: value } })}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.dangerZone', 'Reset')}>
        <div className="flex flex-wrap items-center justify-between gap-4 py-1">
          <div className="min-w-0">
            <p className="text-[13.5px] text-ink-soft">{t('settings.resetAll', 'Reset all settings')}</p>
            <p className="mt-0.5 max-w-[380px] text-[12px] leading-[1.45] text-ink-mute">
              {t(
                'settings.resetAllHint',
                'Theme, fonts, editor, workspace and shortcuts return to their defaults. Notes are untouched.',
              )}
            </p>
            <p className="mt-1 text-[11.5px] text-ink-faint">
              {t('settings.languagePreserved', 'The interface language is preserved')}
            </p>
          </div>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            {t('common.resetDefaults', 'Reset to defaults')}
          </Button>
        </div>
      </SettingsGroup>

      <ConfirmDialog
        open={resetOpen}
        title={t('settings.resetConfirmTitle', 'Reset all settings?')}
        description={t(
          'settings.resetConfirmDesc',
          'Your custom settings will be replaced with the defaults. Notes, tabs and canvas stay in place.',
        )}
        confirmLabel={t('common.resetDefaults', 'Reset to defaults')}
        cancelLabel={t('common.cancel', 'Cancel')}
        danger
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </>
  )
}
