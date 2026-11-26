/**
 * Fixed palettes for canvas *content* (stickies, shapes, ink).
 *
 * Chrome (panels, toolbars, canvas background) is themed through the CSS
 * variables defined in `index.css`; these colours are deliberately independent
 * so a board keeps its identity in every theme.
 */

export interface Swatch {
  value: string
  label: string
}

/** Sticky-note fills — light pastels so dark text always reads well. */
export const STICKY_COLORS: Swatch[] = [
  { value: '#f3e6a4', label: 'Amber' },
  { value: '#f6d5b8', label: 'Peach' },
  { value: '#f5c3ca', label: 'Rose' },
  { value: '#d8cdf6', label: 'Lavender' },
  { value: '#c7e8d4', label: 'Mint' },
  { value: '#c3dcf5', label: 'Sky' },
  { value: '#e8e0d0', label: 'Sand' },
  { value: '#dcdce4', label: 'Paper' },
]

/** Ink colour used on top of pastel stickies. */
export const STICKY_TEXT_COLOR = '#33322b'

/** Text-object colours (drawn on the board background). */
export const TEXT_COLORS: Swatch[] = [
  { value: '#ececf1', label: 'Paper' },
  { value: '#9d95ff', label: 'Accent' },
  { value: '#f3cf6b', label: 'Amber' },
  { value: '#8fe0aa', label: 'Mint' },
  { value: '#7cc7f5', label: 'Sky' },
  { value: '#ff8fa3', label: 'Rose' },
  { value: '#b28dff', label: 'Violet' },
  { value: '#a9a9b6', label: 'Muted' },
]

/** Shape fills — mostly translucent so connectors stay visible underneath. */
export const SHAPE_FILLS: Swatch[] = [
  { value: 'transparent', label: 'None' },
  { value: 'rgba(135, 127, 254, 0.22)', label: 'Accent' },
  { value: 'rgba(96, 150, 240, 0.20)', label: 'Blue' },
  { value: 'rgba(70, 200, 180, 0.18)', label: 'Teal' },
  { value: 'rgba(240, 190, 90, 0.20)', label: 'Amber' },
  { value: 'rgba(240, 110, 130, 0.20)', label: 'Rose' },
  { value: 'rgba(110, 210, 140, 0.20)', label: 'Green' },
  { value: 'rgba(160, 160, 190, 0.16)', label: 'Slate' },
]

/** Stroke colours for shapes, ink and connectors. */
export const STROKE_COLORS: Swatch[] = [
  { value: '#877ffe', label: 'Accent' },
  { value: '#ececf1', label: 'Paper' },
  { value: '#f3cf6b', label: 'Amber' },
  { value: '#8fe0aa', label: 'Mint' },
  { value: '#ff8fa3', label: 'Rose' },
  { value: '#7cc7f5', label: 'Sky' },
  { value: '#b28dff', label: 'Violet' },
  { value: '#9aa4b2', label: 'Slate' },
]

export const DEFAULT_STICKY_FILL = STICKY_COLORS[0].value
export const DEFAULT_TEXT_COLOR = TEXT_COLORS[0].value
export const DEFAULT_SHAPE_FILL = SHAPE_FILLS[1].value
export const DEFAULT_STROKE = STROKE_COLORS[0].value
export const DEFAULT_CONNECTION_STROKE = '#9d95ff'
export const DEFAULT_CONNECTION_WIDTH = 1.8
export const DEFAULT_DRAW_STROKE = '#9d95ff'
export const DEFAULT_DRAW_WIDTH = 3

/** Font size presets offered by the properties panel. */
export const FONT_SIZES = [11, 13, 15, 18, 22, 28, 36, 48]
