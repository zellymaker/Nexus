/**
 * Appearance: themes (six real palettes + follow-system), interface scale,
 * density, animations and the motion preference.
 */
import { Field, Hint, SettingsGroup } from '../../components/ui/Field'
import { Switch } from '../../components/ui/Switch'
import { useT } from '../../lib/i18n'
import { effectiveReducedMotion } from '../../lib/theme'
import { useStore } from '../../lib/store'
import { fill } from '../utils'
import { useSystemReducedMotion } from '../hooks'
import { Segmented, ThemeGrid } from '../widgets'

export function AppearanceSection() {
  const t = useT()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const systemReduced = useSystemReducedMotion()
  const effectiveReduced = effectiveReducedMotion(settings)

  const motionEffective = !settings.animations
    ? t('settings.motionAnimationsOff', 'Animations are off — motion is reduced everywhere')
    : effectiveReduced
      ? t('settings.motionEffective.reduced', 'Animations are currently off')
      : t('settings.motionEffective.full', 'Animations are currently on')

  return (
    <>
      <SettingsGroup
        title={t('settings.group.theme', 'Colour scheme')}
        description={t(
          'settings.themeHint',
          'The theme applies immediately and is remembered between launches',
        )}
      >
        <ThemeGrid
          value={settings.theme}
          onChange={(value) => updateSettings({ theme: value })}
        />
        <p className="mt-2.5 text-[11.5px] leading-[1.5] text-ink-mute">
          {t(
            'settings.themeSystemHint',
            'Follow system tracks the OS colour scheme and switches automatically',
          )}
        </p>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.interface', 'Interface')}>
        <Field
          label={t('settings.uiScale', 'Interface size')}
          description={t('settings.uiScaleHint', 'Scale of the whole application shell')}
        >
          <Segmented
            label={t('settings.uiScale', 'Interface size')}
            value={settings.uiScale}
            onChange={(value) => updateSettings({ uiScale: value })}
            options={[
              { value: 0.9, label: '90%' },
              { value: 1, label: '100%' },
              { value: 1.1, label: '110%' },
            ]}
          />
        </Field>
        <Field
          label={t('settings.density', 'Density')}
          description={t('settings.densityHint', 'Spacing and row height in lists and panels')}
        >
          <Segmented
            label={t('settings.density', 'Density')}
            value={settings.density}
            onChange={(value) => updateSettings({ density: value })}
            options={[
              {
                value: 'comfortable',
                label: t('settings.density.comfortable', 'Comfortable'),
              },
              { value: 'compact', label: t('settings.density.compact', 'Compact') },
            ]}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.motion', 'Motion')}>
        <Field
          label={t('settings.animations', 'Animations')}
          description={t('settings.animationsHint', 'Smooth panel, menu and tab transitions')}
        >
          <Switch
            label={t('settings.animations', 'Animations')}
            checked={settings.animations}
            onChange={(value) => updateSettings({ animations: value })}
          />
        </Field>
        <Field
          label={t('settings.motion', 'Motion mode')}
          description={t(
            'settings.reducedMotionSystem',
            'Follows the system setting',
          )}
        >
          <Segmented
            label={t('settings.motion', 'Motion mode')}
            value={settings.motion}
            onChange={(value) => updateSettings({ motion: value })}
            options={[
              { value: 'system', label: t('settings.motion.system', 'Follow system') },
              { value: 'full', label: t('settings.motion.full', 'Always') },
              { value: 'reduced', label: t('settings.motion.reduced', 'Less motion') },
            ]}
          />
        </Field>
        <Hint>
          <span className="block">
            {t(
              'settings.motionHint',
              '“Follow system” honours prefers-reduced-motion — the OS reduce-motion setting',
            )}
          </span>
          <span className="mt-1 block">
            {fill(
              t('settings.motionSystemNow', 'System setting: {state}'),
              {
                state: systemReduced
                  ? t('settings.motionState.reduced', 'motion reduced')
                  : t('settings.motionState.full', 'motion enabled'),
              },
            )}
            {' · '}
            {motionEffective}
          </span>
        </Hint>
      </SettingsGroup>
    </>
  )
}
