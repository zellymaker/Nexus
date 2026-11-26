/**
 * Keyboard shortcuts: searchable command list grouped by scope, live recording
 * of new combinations, conflict reporting and per-command / global reset.
 */
import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { Button, IconButton } from '../../components/ui/Button'
import { Hint, Kbd, SettingsGroup } from '../../components/ui/Field'
import { useT } from '../../lib/i18n'
import {
  SHORTCUT_DEFS,
  eventToBinding,
  findConflicts,
  formatBinding,
  normalizeBinding,
  resolveBindings,
  shortcutLabel,
} from '../../lib/shortcuts'
import type { ShortcutConflict, ShortcutDef, ShortcutGroup } from '../../lib/shortcuts'
import { useStore } from '../../lib/store'
import { setRecordingHandler } from '../shortcutRecorder'
import { fill } from '../utils'

const GROUP_ORDER: ShortcutGroup[] = ['workspace', 'navigation', 'editor', 'canvas', 'app']

/**
 * A shared binding is a real conflict only within the same scope: Canvas
 * shortcuts are handled by the canvas module and never fire elsewhere, so a
 * Canvas command may reuse a global combination (and vice versa).
 */
const conflictGroup = (id: string): ShortcutGroup | undefined =>
  SHORTCUT_DEFS.find((def) => def.id === id)?.group

const isRealConflict = (conflict: ShortcutConflict): boolean => {
  const groups = conflict.ids.map(conflictGroup)
  if (!groups.includes('canvas')) return true
  return groups.every((group) => group === 'canvas')
}

const GROUP_LABELS: Record<ShortcutGroup, string> = {
  workspace: 'Workspace',
  navigation: 'Navigation',
  editor: 'Editor',
  canvas: 'Canvas',
  app: 'Application',
}

export function ShortcutsSection() {
  const t = useT()
  const shortcuts = useStore((s) => s.settings.shortcuts)
  const setShortcut = useStore((s) => s.setShortcut)
  const resetShortcuts = useStore((s) => s.resetShortcuts)
  const pushToast = useStore((s) => s.pushToast)
  const [query, setQuery] = useState('')
  const [recordingId, setRecordingId] = useState<string | null>(null)

  const bindings = useMemo(() => resolveBindings(shortcuts), [shortcuts])
  const conflicts = useMemo(() => findConflicts(bindings).filter(isRealConflict), [bindings])
  const conflictByBinding = useMemo(
    () => new Map(conflicts.map((conflict) => [conflict.binding, conflict])),
    [conflicts],
  )

  const assign = (id: string, binding: string) => {
    setShortcut(id, binding)
    const normalized = normalizeBinding(binding)
    const nextBindings = resolveBindings(useStore.getState().settings.shortcuts)
    const conflict = findConflicts(nextBindings)
      .filter(isRealConflict)
      .find((entry) => entry.binding === normalized)
    if (conflict) {
      const names = conflict.ids.map((commandId) => shortcutLabel(commandId, t)).join(', ')
      pushToast({
        title: fill(
          t(
            'settings.shortcutsConflictToast',
            'Combination {binding} is already used by: {names}',
          ),
          { binding: formatBinding(binding), names },
        ),
        tone: 'danger',
      })
      return
    }
    pushToast({
      title: fill(t('settings.shortcutsSaved', 'Shortcut updated to {binding}'), {
        binding: formatBinding(binding),
      }),
      tone: 'success',
    })
  }

  const resetOne = (def: ShortcutDef) => {
    setShortcut(def.id, def.defaultBinding)
    setRecordingId(null)
    pushToast({
      title: fill(t('settings.shortcutsResetOneDone', 'Shortcut reset to {binding}'), {
        binding: formatBinding(def.defaultBinding),
      }),
      tone: 'default',
    })
  }

  const resetAll = () => {
    resetShortcuts()
    setRecordingId(null)
    pushToast({
      title: t('settings.shortcutsResetDone', 'Default shortcuts restored'),
      tone: 'success',
    })
  }

  /* recording: keys are intercepted by the module-level guard in
     ../shortcutRecorder, which runs before the global shortcut runtime */
  useEffect(() => {
    if (!recordingId) {
      setRecordingHandler(null)
      return
    }
    setRecordingHandler((event) => {
      if (event.key === 'Escape') {
        setRecordingId(null)
        return
      }
      const binding = eventToBinding(event)
      if (!binding) return
      assign(recordingId, binding)
      setRecordingId(null)
    })
    return () => setRecordingHandler(null)
    // `assign` closes over shortcuts/t and is re-created on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId, shortcuts, t])

  /* a click outside the recording control cancels the capture */
  useEffect(() => {
    if (!recordingId) return
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.closest('[data-recording="true"]')) return
      setRecordingId(null)
    }
    document.addEventListener('mousedown', onMouseDown, true)
    return () => document.removeEventListener('mousedown', onMouseDown, true)
  }, [recordingId])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return SHORTCUT_DEFS
    return SHORTCUT_DEFS.filter((def) => {
      const label = shortcutLabel(def.id, t).toLowerCase()
      const binding = bindings[def.id] ?? ''
      return (
        label.includes(normalizedQuery) ||
        def.label.toLowerCase().includes(normalizedQuery) ||
        def.id.toLowerCase().includes(normalizedQuery) ||
        binding.toLowerCase().includes(normalizedQuery) ||
        formatBinding(binding).toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query, bindings, t])

  const groups = GROUP_ORDER.map((group) => ({
    group,
    defs: filtered.filter((def) => def.group === group),
  })).filter((entry) => entry.defs.length > 0)

  /* overrides whose effective binding differs from the default */
  const overrideCount = SHORTCUT_DEFS.filter(
    (def) =>
      normalizeBinding(shortcuts[def.id] ?? def.defaultBinding) !==
      normalizeBinding(def.defaultBinding),
  ).length

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[200px] max-w-[320px] flex-1">
          <Search
            size={14}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('settings.shortcutSearch', 'Search commands…')}
            aria-label={t('settings.shortcutSearch', 'Search commands…')}
            className="h-[32px] w-full rounded-lg border border-line bg-surface-2 pl-8 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] text-ink-faint">
            {fill(t('settings.shortcutsCount', 'Commands: {n}'), { n: filtered.length })}
          </span>
          <Button size="sm" variant="secondary" onClick={resetAll} disabled={overrideCount === 0}>
            <RotateCcw size={13} strokeWidth={1.9} />
            {t('settings.shortcutsReset', 'Restore default shortcuts')}
          </Button>
        </div>
      </div>

      <div className="mb-5 space-y-2">
        <Hint>
          <span className="block">{t('settings.shortcutsHint', 'Click a shortcut and type a new one')}</span>
          {recordingId && (
            <span className="mt-1 block text-accent-bright">
              {t(
                'settings.shortcutsRecordingHint',
                'Press any combination. Esc cancels.',
              )}
            </span>
          )}
          {conflicts.length > 0 && (
            <span className="mt-1 block">
              <span className="block">
                {t(
                  'settings.shortcutsConflictScope',
                  'Only conflicts within one scope are reported: Canvas shortcuts only work while the canvas is active.',
                )}
              </span>
              <span className="mt-1 block break-words font-mono text-[11px] text-warn">
                {conflicts
                  .map(
                    (conflict) =>
                      `${formatBinding(conflict.binding)} → ${conflict.ids
                        .map((commandId) => shortcutLabel(commandId, t))
                        .join(' / ')}`,
                  )
                  .join(' · ')}
              </span>
            </span>
          )}
        </Hint>
      </div>

      {groups.length === 0 && (
        <p className="rounded-lg border border-line bg-surface-2 px-3 py-4 text-center text-[12.5px] text-ink-mute">
          {t('settings.shortcutsSearchEmpty', 'No commands found')}
        </p>
      )}

      {groups.map(({ group, defs }) => (
        <SettingsGroup
          key={group}
          title={t(`settings.shortcuts.group.${group}`, GROUP_LABELS[group])}
        >
          {defs.map((def) => {
            const binding = bindings[def.id] ?? ''
            const custom =
              shortcuts[def.id] !== undefined &&
              normalizeBinding(shortcuts[def.id]) !== normalizeBinding(def.defaultBinding)
            const normalized = normalizeBinding(binding)
            const conflict = normalized ? conflictByBinding.get(normalized) : undefined
            const otherNames =
              conflict?.ids
                .filter((commandId) => commandId !== def.id)
                .map((commandId) => shortcutLabel(commandId, t)) ?? []
            const recording = recordingId === def.id
            return (
              <div
                key={def.id}
                className="flex items-center justify-between gap-4 border-b border-line py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-ink-soft">{shortcutLabel(def.id, t)}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-faint">
                    {custom && (
                      <>
                        <span className="text-accent-bright">
                          {t('settings.shortcutsChanged', 'customised')}
                        </span>
                        <span>·</span>
                        <span>
                          {fill(t('settings.shortcutsDefaultIs', 'Default: {binding}'), {
                            binding: formatBinding(def.defaultBinding),
                          })}
                        </span>
                      </>
                    )}
                    {otherNames.length > 0 && (
                      <span className="text-warn">
                        {fill(t('settings.shortcutConflict', 'Conflict: {names}'), {
                          names: otherNames.join(', '),
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {custom && (
                    <IconButton
                      label={t('settings.shortcutsResetOne', 'Reset shortcut')}
                      compact
                      onClick={() => resetOne(def)}
                    >
                      <RotateCcw size={12.5} strokeWidth={1.9} />
                    </IconButton>
                  )}
                  <button
                    type="button"
                    data-recording={recording ? 'true' : undefined}
                    aria-label={
                      recording
                        ? t('settings.shortcutsRecording', 'Press a new combination…')
                        : t('settings.shortcutsRecord', 'Record a new shortcut')
                    }
                    onClick={() => setRecordingId(recording ? null : def.id)}
                    className={`flex min-w-[118px] items-center justify-center rounded-lg border px-2 py-[5px] transition-colors ${
                      recording
                        ? 'border-accent bg-elevated'
                        : 'border-line bg-surface-2 hover:border-line-strong hover:bg-surface-3'
                    }`}
                  >
                    {recording ? (
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-accent-bright">
                        <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-accent" />
                        {t('settings.shortcutsRecording', 'Press a new combination…')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        {binding ? (
                          binding
                            .split('+')
                            .map((part) => <Kbd key={`${def.id}-${part}`}>{part}</Kbd>)
                        ) : (
                          <span className="text-[11.5px] text-ink-faint">
                            {t('common.none', 'None')}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </SettingsGroup>
      ))}
    </>
  )
}
