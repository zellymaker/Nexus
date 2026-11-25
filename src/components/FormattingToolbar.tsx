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
  label: string
  icon: LucideIcon
}

const BUTTONS: ToolButton[] = [
  { action: 'scroll-top', label: 'Scroll to top', icon: ChevronsLeft },
  { action: 'heading', label: 'Heading', icon: Heading2 },
  { action: 'bold', label: 'Bold', icon: Bold },
  { action: 'italic', label: 'Italic', icon: Italic },
  { action: 'underline', label: 'Underline', icon: Underline },
  { action: 'link', label: 'Link', icon: Paperclip },
  { action: 'ul', label: 'Bulleted list', icon: List },
  { action: 'ol', label: 'Numbered list', icon: ListOrdered },
  { action: 'code', label: 'Code block', icon: SquareCode },
]

interface FormattingToolbarProps {
  onFormat: (action: FormatAction) => void
}

export function FormattingToolbar({ onFormat }: FormattingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="pointer-events-auto inline-flex h-[32px] items-center gap-[1px] rounded-[9px] border border-[#34343c] bg-[#222228]/95 px-[4px] shadow-toolbar backdrop-blur-[6px]"
    >
      {BUTTONS.map((b, i) => {
        const Icon = b.icon
        const active = b.action === 'heading'
        return (
          <button
            key={b.action}
            type="button"
            title={b.label}
            aria-label={b.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat(b.action)}
            className={`grid h-[24px] w-[24px] place-items-center rounded-[6px] transition-colors ${
              i === 0 ? 'mr-[2px]' : ''
            } ${
              active
                ? 'bg-[#303038] text-[#e8e8ec]'
                : 'text-[#b0b0ba] hover:bg-white/[0.07] hover:text-[#e4e4ea]'
            }`}
          >
            <Icon size={15} strokeWidth={1.9} />
          </button>
        )
      })}
      <span className="mx-[5px] h-[16px] w-px bg-white/[0.12]" />
      <button
        type="button"
        title="Clear formatting"
        aria-label="Clear formatting"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('clear')}
        className="grid h-[24px] w-[24px] place-items-center rounded-[6px] text-[#b0b0ba] transition-colors hover:bg-white/[0.07] hover:text-[#e4e4ea]"
      >
        <Ellipsis size={16} strokeWidth={1.9} />
      </button>
    </div>
  )
}
