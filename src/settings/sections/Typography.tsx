/**
 * Typography: interface/editor/mono font families, base text size, line
 * height and weight — all applied live through the settings store, plus a
 * small preview and a fallback warning when a font is missing on the system.
 */
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Field, SettingsGroup } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { useT } from '../../lib/i18n'
import { MONO_FONT_OPTIONS, UI_FONT_OPTIONS } from '../../lib/settings'
import { useStore } from '../../lib/store'
import { cssFontStack } from '../utils'
import { useUnavailableFonts } from '../hooks'
import { Segmented, SliderField } from '../widgets'

export function TypographySection() {
  const t = useT()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const typography = settings.typography
  const missingFonts = useUnavailableFonts([
    typography.uiFont,
    typography.editorFont,
    typography.monoFont,
  ])

  const fontWarning = (family: string) =>
    missingFonts.includes(family) ? (
      <span
        className="flex items-center gap-1 text-[11px] text-warn"
        title={t('settings.fontMissing', 'Font not installed — a fallback font will be used')}
      >
        <TriangleAlert size={13} strokeWidth={2} />
        <span className="hidden xl:inline">
          {t('settings.fontMissingShort', 'Not installed')}
        </span>
      </span>
    ) : null

  const fontControl = (family: string, children: ReactNode) => (
    <div className="flex items-center gap-2">
      {fontWarning(family)}
      {children}
    </div>
  )

  return (
    <>
      <SettingsGroup
        title={t('settings.group.fonts', 'Fonts')}
        description={t(
          'settings.fontHint',
          'If a font is missing on the system, a fallback font is used',
        )}
      >
        <Field label={t('settings.uiFont', 'Interface font')}>
          {fontControl(
            typography.uiFont,
            <Select
              label={t('settings.uiFont', 'Interface font')}
              value={typography.uiFont}
              options={UI_FONT_OPTIONS}
              onChange={(value) => updateSettings({ typography: { uiFont: value } })}
            />,
          )}
        </Field>
        <Field label={t('settings.editorFont', 'Editor font')}>
          {fontControl(
            typography.editorFont,
            <Select
              label={t('settings.editorFont', 'Editor font')}
              value={typography.editorFont}
              options={UI_FONT_OPTIONS}
              onChange={(value) => updateSettings({ typography: { editorFont: value } })}
            />,
          )}
        </Field>
        <Field label={t('settings.monoFont', 'Monospace font')}>
          {fontControl(
            typography.monoFont,
            <Select
              label={t('settings.monoFont', 'Monospace font')}
              value={typography.monoFont}
              options={MONO_FONT_OPTIONS}
              onChange={(value) => updateSettings({ typography: { monoFont: value } })}
            />,
          )}
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.text', 'Text size')}>
        <SliderField
          label={t('settings.baseSize', 'Text size')}
          description={t('settings.baseSizeHint', 'Base interface text size, {n} px').replace(
            '{n}',
            String(typography.baseSize),
          )}
          value={typography.baseSize}
          min={13}
          max={18}
          step={0.5}
          format={(value) => `${value} px`}
          onChange={(value) => updateSettings({ typography: { baseSize: value } })}
        />
        <SliderField
          label={t('settings.lineHeight', 'Line height')}
          description={t(
            'settings.lineHeightHint',
            'Line-height multiplier of the interface text',
          )}
          value={typography.lineHeight}
          min={1.3}
          max={1.8}
          step={0.05}
          format={(value) => value.toFixed(2)}
          onChange={(value) => updateSettings({ typography: { lineHeight: value } })}
        />
        <Field
          label={t('settings.fontWeight', 'Font weight')}
          description={t(
            'settings.fontWeightHint',
            'Weight of the main interface text',
          )}
        >
          <Segmented
            label={t('settings.fontWeight', 'Font weight')}
            value={typography.fontWeight}
            onChange={(value) => updateSettings({ typography: { fontWeight: value } })}
            options={[300, 400, 500, 600, 700].map((weight) => ({
              value: weight,
              label: String(weight),
            }))}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.preview', 'Preview')}>
        <div className="rounded-xl border border-line bg-surface-2 px-4 py-3.5">
          <p
            className="text-ink"
            style={{
              fontFamily: cssFontStack(typography.uiFont),
              fontSize: `${typography.baseSize}px`,
              lineHeight: typography.lineHeight,
              fontWeight: typography.fontWeight,
            }}
          >
            {t('settings.previewHeading', 'Notes are an extension of thinking')}
          </p>
          <p
            className="mt-1 text-ink-soft"
            style={{
              fontFamily: cssFontStack(typography.uiFont),
              fontSize: `${typography.baseSize}px`,
              lineHeight: typography.lineHeight,
              fontWeight: typography.fontWeight,
            }}
          >
            {t(
              'settings.previewSample',
              'The quick brown fox jumps over the lazy dog. 1234567890',
            )}
          </p>
          <p
            className="mt-2.5 rounded-md bg-surface-3 px-2 py-1 text-ink-mute"
            style={{
              fontFamily: cssFontStack(typography.monoFont),
              fontSize: '12.5px',
            }}
          >
            {t('settings.previewMono', 'const idea = connect(note, canvas)')}
          </p>
        </div>
      </SettingsGroup>
    </>
  )
}
