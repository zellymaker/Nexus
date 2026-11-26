/**
 * About: application identity, exact versions of the stack, third-party
 * licence overview and a "copy version info" action.
 */
import { useState } from 'react'
import { Check, Copy, ShieldCheck, Sparkles, WifiOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { SettingsGroup } from '../../components/ui/Field'
import { useT } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { resolveTheme } from '../../lib/theme'
import { copyText } from '../utils'

/** Kept in sync with `package.json`, `src-tauri/tauri.conf.json` and `Cargo.toml`. */
const APP_VERSION = '0.1.0'
const TAURI_VERSION = '2.12.7'
const TAURI_API_VERSION = '2.12.5'

const STACK: { name: string; version: string }[] = [
  { name: 'Tauri', version: TAURI_VERSION },
  { name: '@tauri-apps/api', version: TAURI_API_VERSION },
  { name: 'React', version: '19.3.1' },
  { name: 'TypeScript', version: '7.0.2' },
  { name: 'Vite', version: '8.3.8' },
  { name: 'Tailwind CSS', version: '3.4.17' },
  { name: 'zustand', version: '5.1.0' },
  { name: 'Konva', version: '10.11.0' },
  { name: 'react-konva', version: '19.3.2' },
  { name: 'lucide-react', version: '1.79.0' },
  { name: '@fontsource-variable/inter', version: '5.3.0' },
]

const LICENSES: { license: string; packages: string[] }[] = [
  {
    license: 'MIT',
    packages: ['React', 'Vite', 'Tailwind CSS', 'zustand', 'Konva', 'react-konva'],
  },
  { license: 'ISC', packages: ['lucide-react'] },
  { license: 'Apache-2.0', packages: ['TypeScript'] },
  { license: 'MIT OR Apache-2.0', packages: ['Tauri', '@tauri-apps/api'] },
  { license: 'OFL-1.1', packages: ['Inter', '@fontsource-variable/inter'] },
]

export function AboutSection() {
  const t = useT()
  const settings = useStore((s) => s.settings)
  const pushToast = useStore((s) => s.pushToast)
  const [copied, setCopied] = useState(false)

  const buildVersionInfo = () => {
    const theme = resolveTheme(settings.theme)
    return [
      `NEXUS ${APP_VERSION}`,
      `Tauri ${TAURI_VERSION} · @tauri-apps/api ${TAURI_API_VERSION}`,
      ...STACK.filter((item) => item.name !== 'Tauri' && item.name !== '@tauri-apps/api').map(
        (item) => `${item.name} ${item.version}`,
      ),
      `Theme: ${theme}${settings.theme === 'system' ? ' (system)' : ''}`,
      `Language: ${settings.language}`,
      `UI scale: ${Math.round(settings.uiScale * 100)}%`,
    ].join('\n')
  }

  const handleCopy = async () => {
    const ok = await copyText(buildVersionInfo())
    if (!ok) {
      pushToast({ title: t('settings.about.copyFailed', 'Could not copy to clipboard'), tone: 'danger' })
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-line bg-surface-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-elevated text-accent-bright">
              <Sparkles size={22} strokeWidth={1.9} />
            </span>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">NEXUS</h3>
                <span className="tabular rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px] text-ink-mute">
                  {APP_VERSION}
                </span>
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-mute">
                {t('settings.aboutHint', 'A local knowledge workspace')}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check size={13} strokeWidth={2.2} className="text-success" />
            ) : (
              <Copy size={13} strokeWidth={1.9} />
            )}
            {copied
              ? t('settings.about.copied', 'Version info copied')
              : t('settings.about.copy', 'Copy version info')}
          </Button>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink-mute">
            <WifiOff size={12} strokeWidth={1.9} className="text-success" />
            {t('settings.about.offline', 'Works fully offline')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink-mute">
            <ShieldCheck size={12} strokeWidth={1.9} className="text-success" />
            {t('settings.about.localOnly', 'No accounts, no cloud sync')}
          </span>
        </div>
      </div>

      <SettingsGroup title={t('settings.group.version', 'Version')}>
        <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
          <span className="text-[13px] text-ink-soft">
            {t('settings.about.appVersion', 'Application version')}
          </span>
          <span className="tabular text-[12px] text-ink-mute">{APP_VERSION}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
          <span className="text-[13px] text-ink-soft">
            {t('settings.about.tauriVersion', 'Tauri')}
          </span>
          <span className="tabular text-[12px] text-ink-mute">{TAURI_VERSION}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
          <span className="text-[13px] text-ink-soft">
            {t('settings.about.runtime', 'Runtime')}
          </span>
          <span className="text-[12px] text-ink-mute">
            {t('settings.about.runtimeValue', 'WebView via Tauri (WebKitGTK / WebView2)')}
          </span>
        </div>
      </SettingsGroup>

      <SettingsGroup
        title={t('settings.group.tech', 'Technologies')}
        description={t(
          'settings.about.techHint',
          'The stack the NEXUS interface is built with',
        )}
      >
        {STACK.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-4 border-b border-line py-2"
          >
            <span className="text-[13px] text-ink-soft">{item.name}</span>
            <span className="tabular text-[12px] text-ink-mute">{item.version}</span>
          </div>
        ))}
      </SettingsGroup>

      <SettingsGroup
        title={t('settings.group.licenses', 'Licences')}
        description={t(
          'settings.about.licensesHint',
          'Third-party libraries are distributed under open licences',
        )}
      >
        {LICENSES.map((entry) => (
          <div
            key={entry.license}
            className="flex items-start justify-between gap-5 border-b border-line py-2.5"
          >
            <span className="text-[12.5px] leading-[1.5] text-ink-soft">
              {entry.packages.join(', ')}
            </span>
            <span className="shrink-0 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-mute">
              {entry.license}
            </span>
          </div>
        ))}
      </SettingsGroup>
    </>
  )
}
