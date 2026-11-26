import {
  Bold,
  ChevronsLeft,
  Ellipsis,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Paperclip,
  SquareCode,
  Underline,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '../lib/i18n'

export type FormatAction =
  | 'scroll-top'
  | 'heading'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'link'
  | 'ul'
  | 'ol'
  | 'code'
  | 'clear'

interface ToolButton {
  action: FormatAction
  labelKey: string
  fallback: string
  icon: LucideIcon
}

const BUTTONS: ToolButton[] = [
  { action: 'scroll-top', labelKey: 'editor.scrollTop', fallback: 'Scroll to top', icon: ChevronsLeft },
  { action: 'heading', labelKey: 'editor.heading', fallback: 'Heading', icon: Heading2 },
  { action: 'bold', labelKey: 'editor.bold', fallback: 'Bold', icon: Bold },
  { action: 'italic', labelKey: 'editor.italic', fallback: 'Italic', icon: Italic },
  { action: 'underline', labelKey: 'editor.underline', fallback: 'Underline', icon: Underline },
  { action: 'link', labelKey: 'editor.link', fallback: 'Link', icon: Paperclip },
  { action: 'ul', labelKey: 'editor.bulletList', fallback: 'Bulleted list', icon: List },
  { action: 'ol', labelKey: 'editor.numberedList', fallback: 'Numbered list', icon: ListOrdered },
  { action: 'code', labelKey: 'editor.codeBlock', fallback: 'Code block', icon: SquareCode },
]

interface FormattingToolbarProps {
  onFormat: (action: FormatAction) => void
}

export function FormattingToolbar({ onFormat }: FormattingToolbarProps) {
  const t = useT()
  return (
    <div
      role="toolbar"
      aria-label={t('editor.formatting', 'Text formatting')}
      className="anim-fade-in pointer-events-auto inline-flex h-[32px] items-center gap-[1px] rounded-[9px] border border-line-strong bg-toolbar/95 px-[4px] shadow-toolbar backdrop-blur-[6px]"
    >
      {BUTTONS.map((button, index) => {
        const Icon = button.icon
        const active = button.action === 'heading'
        const label = t(button.labelKey, button.fallback)
        return (
          <button
            key={button.action}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onFormat(button.action)}
            className={`grid h-[24px] w-[24px] place-items-center rounded-[6px] transition-colors ${
              index === 0 ? 'mr-[2px]' : ''
            } ${
              active
                ? 'bg-surface-3 text-ink'
                : 'text-ink-dim hover:bg-hover hover:text-ink'
            }`}
          >
            <Icon size={15} strokeWidth={1.9} />
          </button>
        )
      })}
      <span className="mx-[5px] h-[16px] w-px bg-line-strong" />
      <button
        type="button"
        title={t('editor.clearFormatting', 'Clear formatting')}
        aria-label={t('editor.clearFormatting', 'Clear formatting')}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onFormat('clear')}
        className="grid h-[24px] w-[24px] place-items-center rounded-[6px] text-ink-dim transition-colors hover:bg-hover hover:text-ink"
      >
        <Ellipsis size={16} strokeWidth={1.9} />
      </button>
    </div>
  )
}
