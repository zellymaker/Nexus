/**
 * Editor settings: text size, line height, wrapping, line numbers, syntax
 * highlighting, cursor style and tab size — with a live preview.
 */
import { Field, SettingsGroup } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { Switch } from '../../components/ui/Switch'
import { useT } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { cssFontStack } from '../utils'
import { Segmented, SliderField } from '../widgets'

export function EditorSection() {
  const t = useT()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const editor = settings.editor
  const fontFamily = cssFontStack(settings.typography.editorFont)

  return (
    <>
      <SettingsGroup title={t('settings.group.preview', 'Preview')}>
        <div className="rounded-xl border border-line bg-main px-4 py-3.5">
          <div
            className="text-ink-soft"
            style={{
              fontFamily,
              fontSize: `${editor.fontSize}px`,
              lineHeight: editor.lineHeight,
              whiteSpace: editor.wrap ? 'pre-wrap' : 'pre',
              overflowX: editor.wrap ? undefined : 'auto',
            }}
          >
            <div className="mb-1 font-semibold text-ink">
              <span
                className={editor.syntaxHighlight ? '' : 'opacity-75'}
                style={editor.syntaxHighlight ? { color: 'var(--md-mark)' } : undefined}
              >
                ##{' '}
              </span>
              {t('settings.previewHeading', 'Notes are an extension of thinking')}
            </div>
            <div>
              {t(
                'settings.previewSample',
                'The quick brown fox jumps over the lazy dog. 1234567890',
              )}
              <span
                className="ml-0.5 inline-block align-middle bg-accent"
                style={{
                  width: editor.cursorStyle === 'block' ? '0.55em' : '2px',
                  height: editor.cursorStyle === 'underline' ? '2px' : '1.05em',
                  marginBottom: editor.cursorStyle === 'underline' ? '0.1em' : undefined,
                  opacity: 0.85,
                }}
              />
            </div>
            <div
              className="mt-1 text-ink-mute"
              style={{ fontFamily: cssFontStack(settings.typography.monoFont), fontSize: '12.5px' }}
            >
              {t('settings.previewMono', 'const idea = connect(note, canvas)')}
            </div>
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.display', 'Display')}>
        <SliderField
          label={t('settings.editorFontSize', 'Editor font size')}
          description={t('settings.editorFontSizeHint', 'Text size in the editor, {n} px').replace(
            '{n}',
            String(editor.fontSize),
          )}
          value={editor.fontSize}
          min={12}
          max={24}
          step={0.5}
          format={(value) => `${value} px`}
          onChange={(value) => updateSettings({ editor: { fontSize: value } })}
        />
        <SliderField
          label={t('settings.editorLineHeight', 'Editor line height')}
          description={t('settings.editorLineHeightHint', 'Line spacing in the editor')}
          value={editor.lineHeight}
          min={1.2}
          max={2.2}
          step={0.02}
          format={(value) => value.toFixed(2)}
          onChange={(value) => updateSettings({ editor: { lineHeight: value } })}
        />
        <Field
          label={t('settings.editorWrap', 'Wrap lines')}
          description={t(
            'settings.editorWrapHint',
            'Wrap long lines to the width of the editor',
          )}
        >
          <Switch
            label={t('settings.editorWrap', 'Wrap lines')}
            checked={editor.wrap}
            onChange={(value) => updateSettings({ editor: { wrap: value } })}
          />
        </Field>
        <Field
          label={t('settings.editorLineNumbers', 'Line numbers')}
          description={t('settings.editorLineNumbersHint', 'Show line numbers next to the text')}
        >
          <Switch
            label={t('settings.editorLineNumbers', 'Line numbers')}
            checked={editor.lineNumbers}
            onChange={(value) => updateSettings({ editor: { lineNumbers: value } })}
          />
        </Field>
        <Field
          label={t('settings.editorHighlight', 'Syntax highlighting')}
          description={t(
            'settings.editorHighlightHint',
            'Highlight Markdown markup and links',
          )}
        >
          <Switch
            label={t('settings.editorHighlight', 'Syntax highlighting')}
            checked={editor.syntaxHighlight}
            onChange={(value) => updateSettings({ editor: { syntaxHighlight: value } })}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title={t('settings.group.cursor', 'Cursor and indentation')}>
        <Field
          label={t('settings.cursorStyle', 'Cursor style')}
          description={t('settings.cursorHint', 'How the caret looks in the editor')}
        >
          <Segmented
            label={t('settings.cursorStyle', 'Cursor style')}
            value={editor.cursorStyle}
            onChange={(value) => updateSettings({ editor: { cursorStyle: value } })}
            options={[
              { value: 'bar', label: t('settings.cursor.bar', 'Bar') },
              { value: 'underline', label: t('settings.cursor.underline', 'Underline') },
              { value: 'block', label: t('settings.cursor.block', 'Block') },
            ]}
          />
        </Field>
        <Field
          label={t('settings.tabSize', 'Tab size')}
          description={t('settings.tabSizeHint', 'Width of a tab character')}
        >
          <Select
            label={t('settings.tabSize', 'Tab size')}
            value={editor.tabSize}
            options={[2, 4, 8].map((value) => ({
              value,
              label: String(value),
            }))}
            onChange={(value) => updateSettings({ editor: { tabSize: value } })}
          />
        </Field>
      </SettingsGroup>
    </>
  )
}
