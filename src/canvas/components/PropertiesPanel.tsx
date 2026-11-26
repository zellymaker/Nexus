/**
 * Properties panel (right side): object / connector styling, alignment,
 * z-order, grouping and destructive actions.
 */
import { useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  BringToFront,
  Copy,
  Group as GroupIcon,
  SendToBack,
  Trash2,
  Ungroup,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '../../lib/i18n'
import type { TFunction } from '../../lib/messages'
import {
  FONT_SIZES,
  SHAPE_FILLS,
  STICKY_COLORS,
  STROKE_COLORS,
  TEXT_COLORS,
} from '../palette'
import type { Swatch } from '../palette'
import { useActiveCanvas, useCanvasStore } from '../store'
import type { AlignMode, CanvasObject, TextAlign, Viewport } from '../types'
import { visibleWorldRect } from '../utils/geometry'
import { objectTypeKey } from '../utils/objects'
import { chrome, floatingPanelStyle } from '../theme'

export interface PropertiesPanelProps {
  viewport: Viewport
  size: { width: number; height: number }
}

const isFillable = (object: CanvasObject) =>
  object.kind === 'sticky' || object.kind === 'rect' || object.kind === 'ellipse'

const isStroked = (object: CanvasObject) =>
  object.kind === 'rect' || object.kind === 'ellipse' || object.kind === 'draw'

const hasFont = (object: CanvasObject) =>
  object.kind === 'sticky' || object.kind === 'text'

export function PropertiesPanel({ viewport, size }: PropertiesPanelProps) {
  const t = useT()
  const canvas = useActiveCanvas()
  const selection = useCanvasStore((state) => state.selection)
  const updateObjects = useCanvasStore((state) => state.updateObjects)
  const updateConnection = useCanvasStore((state) => state.updateConnection)
  const align = useCanvasStore((state) => state.align)
  const zOrder = useCanvasStore((state) => state.zOrder)
  const groupSelection = useCanvasStore((state) => state.groupSelection)
  const ungroupSelection = useCanvasStore((state) => state.ungroupSelection)
  const duplicateSelection = useCanvasStore((state) => state.duplicateSelection)
  const deleteSelection = useCanvasStore((state) => state.deleteSelection)
  const select = useCanvasStore((state) => state.select)

  const selectedObjects = useMemo(
    () => (canvas ? canvas.objects.filter((object) => selection.includes(object.id)) : []),
    [canvas, selection],
  )
  const selectedConnections = useMemo(
    () =>
      canvas ? canvas.connections.filter((connection) => selection.includes(connection.id)) : [],
    [canvas, selection],
  )

  const patch = (value: Record<string, unknown>, key: string, sources: CanvasObject[]) => {
    if (!sources.length) return
    updateObjects(
      sources.map((object) => ({ id: object.id, patch: value })),
      { history: true, key },
    )
  }

  const fillSources = selectedObjects.filter(isFillable)
  const strokeSources = selectedObjects.filter(isStroked)
  const fontSources = selectedObjects.filter(hasFont)
  const textColorSources = selectedObjects.filter((object) => object.kind === 'text')

  const fillSwatches: Swatch[] = fillSources.some((object) => object.kind === 'sticky')
    ? STICKY_COLORS
    : SHAPE_FILLS
  const fillValue = fillSources.length
    ? ((fillSources[0] as { fill?: string }).fill ?? undefined)
    : undefined
  const strokeValue = strokeSources.length
    ? ((strokeSources[0] as { stroke?: string }).stroke ?? undefined)
    : undefined
  const strokeWidthValue = strokeSources.length
    ? ((strokeSources[0] as { strokeWidth?: number }).strokeWidth ?? 1)
    : 1
  const fontSizeValue = fontSources.length
    ? ((fontSources[0] as { fontSize?: number }).fontSize ?? 15)
    : 15
  const textColorValue = textColorSources.length
    ? (textColorSources[0] as Extract<CanvasObject, { color: string }>).color
    : undefined
  const opacityValue = selectedObjects.length ? selectedObjects[0].opacity : 1

  const textEditSource =
    selectedObjects.length === 1 &&
    (selectedObjects[0].kind === 'sticky' || selectedObjects[0].kind === 'text')
      ? selectedObjects[0]
      : null

  const connection = selectedConnections[0]

  const selectionLabel = selectedObjects.length
    ? selectedObjects.length === 1
      ? t(objectTypeKey(selectedObjects[0].kind), 'Object')
      : `${selectedObjects.length} ${t('canvas.objects', 'Objects')}`
    : selectedConnections.length
      ? t('canvas.tools.connector', 'Connector')
      : ''

  const applyAlign = (mode: AlignMode) => {
    align(mode, visibleWorldRect(viewport, size))
  }

  const hasSelection = selectedObjects.length > 0 || selectedConnections.length > 0

  return (
    <aside
      aria-label={t('canvas.properties', 'Properties')}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 252,
        maxHeight: 'calc(100% - 24px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        ...floatingPanelStyle,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '9px 12px 8px',
          borderBottom: `1px solid ${chrome.border}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: chrome.text }}>
          {t('canvas.properties', 'Properties')}
        </span>
        <span style={{ fontSize: 11, color: chrome.mute }}>{selectionLabel}</span>
      </div>

      <div style={{ padding: 12, overflowY: 'auto', minHeight: 0 }} className="scroll-thin">
        {!hasSelection && canvas && (
          <>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: chrome.text }}>
              {canvas.name}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: 11.5, color: chrome.mute, lineHeight: 1.5 }}>
              {canvas.objects.length} {t('canvas.objects', 'objects')} ·{' '}
              {canvas.connections.length} {t('canvas.tools.connector', 'connectors')} ·{' '}
              {Math.round(viewport.scale * 100)}%
            </p>
            <div style={{ marginTop: 12, height: 1, background: chrome.border }} />
            <p style={{ margin: '12px 0 0', fontSize: 11.5, lineHeight: 1.6, color: chrome.mute }}>
              {t(
                'canvas.properties',
                'Select an object to edit its colours, text, size and position.',
              )}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.6, color: chrome.mute }}>
              V select · H hand · S sticky · T text · R shape · C connector · D draw · E eraser
            </p>
            {canvas.objects.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <SmallButton onClick={() => select(canvas.objects.map((object) => object.id))}>
                  {t('canvas.objects', 'Select all objects')}
                </SmallButton>
              </div>
            )}
          </>
        )}

        {fillSources.length > 0 && (
          <Section title={t('canvas.fill', 'Fill')}>
            <Swatches
              swatches={fillSwatches}
              value={fillValue}
              onPick={(value) => patch({ fill: value }, 'fill', fillSources)}
            />
          </Section>
        )}

        {textColorSources.length > 0 && (
          <Section title={t('canvas.textColor', 'Text colour')}>
            <Swatches
              swatches={TEXT_COLORS}
              value={textColorValue}
              onPick={(value) => patch({ color: value }, 'text-color', textColorSources)}
            />
          </Section>
        )}

        {strokeSources.length > 0 && (
          <Section title={t('canvas.stroke', 'Stroke')}>
            <Swatches
              swatches={STROKE_COLORS}
              value={strokeValue}
              onPick={(value) => patch({ stroke: value }, 'stroke', strokeSources)}
            />
            <SliderRow
              label={t('canvas.strokeWidth', 'Width')}
              value={strokeWidthValue}
              min={0}
              max={10}
              step={0.5}
              suffix="px"
              onChange={(value) => patch({ strokeWidth: value }, 'stroke-width', strokeSources)}
            />
          </Section>
        )}

        {fontSources.length > 0 && (
          <Section title={t('canvas.fontSize', 'Font size')}>
            <FontSizeRow
              value={fontSizeValue}
              t={t}
              onChange={(value) => patch({ fontSize: value }, 'font-size', fontSources)}
            />
            {textColorSources.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {['Bold', 'Regular'].map((label) => (
                    <SmallButton
                      key={label}
                      onClick={() =>
                        patch({ bold: label === 'Bold' }, 'bold', textColorSources)
                      }
                    >
                      {label}
                    </SmallButton>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {(['left', 'center', 'right'] as TextAlign[]).map((textAlign) => (
                    <SmallButton
                      key={textAlign}
                      onClick={() => patch({ align: textAlign }, 'text-align', textColorSources)}
                    >
                      {textAlign === 'left' ? 'L' : textAlign === 'center' ? 'C' : 'R'}
                    </SmallButton>
                  ))}
                </div>
              </>
            )}
          </Section>
        )}

        {textEditSource && (
          <Section title={t('canvas.tools.text', 'Text')}>
            <textarea
              value={textEditSource.text}
              rows={3}
              spellCheck={false}
              onChange={(event) =>
                patch({ text: event.target.value }, 'object-text', [textEditSource])
              }
              style={{
                width: '100%',
                minHeight: 58,
                resize: 'vertical',
                borderRadius: 7,
                border: `1px solid ${chrome.border}`,
                background: chrome.input,
                color: chrome.text,
                fontSize: 12.5,
                font: 'inherit',
                lineHeight: 1.5,
                padding: '7px 8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </Section>
        )}

        {selectedObjects.length > 0 && (
          <Section title={t('canvas.opacity', 'Opacity')}>
            <SliderRow
              label=""
              value={Math.round(opacityValue * 100)}
              min={10}
              max={100}
              step={5}
              suffix="%"
              onChange={(value) =>
                patch({ opacity: value / 100 }, 'opacity', selectedObjects)
              }
            />
          </Section>
        )}

        {selectedObjects.length > 0 && (
          <Section title={t('canvas.align.left', 'Align')}>
            <div style={{ display: 'flex', gap: 3 }}>
              {(
                [
                  ['left', AlignLeft, 'canvas.align.left', 'Left'],
                  ['center', AlignCenter, 'canvas.align.center', 'Center'],
                  ['right', AlignRight, 'canvas.align.right', 'Right'],
                  ['top', AlignStartVertical, 'canvas.align.top', 'Top'],
                  ['middle', AlignCenterVertical, 'canvas.align.middle', 'Middle'],
                  ['bottom', AlignEndVertical, 'canvas.align.bottom', 'Bottom'],
                ] as Array<[AlignMode, LucideIcon, string, string]>
              ).map(([mode, Icon, key, fallback]) => (
                <IconButton
                  key={mode}
                  label={t(key, fallback)}
                  onClick={() => applyAlign(mode)}
                >
                  <Icon size={15} strokeWidth={1.8} />
                </IconButton>
              ))}
            </div>
          </Section>
        )}

        {selectedObjects.length > 0 && (
          <Section title={t('canvas.objects', 'Arrange')}>
            <div style={{ display: 'flex', gap: 3 }}>
              <IconButton
                label={t('canvas.bringFront', 'Bring to front')}
                onClick={() => zOrder('front')}
              >
                <BringToFront size={15} strokeWidth={1.8} />
              </IconButton>
              <IconButton
                label={t('canvas.sendBack', 'Send to back')}
                onClick={() => zOrder('back')}
              >
                <SendToBack size={15} strokeWidth={1.8} />
              </IconButton>
              <IconButton
                label={t('canvas.group', 'Group')}
                disabled={selectedObjects.length < 2}
                onClick={() => groupSelection()}
              >
                <GroupIcon size={15} strokeWidth={1.8} />
              </IconButton>
              <IconButton
                label={t('canvas.ungroup', 'Ungroup')}
                disabled={!selectedObjects.some((object) => object.groupId)}
                onClick={() => ungroupSelection()}
              >
                <Ungroup size={15} strokeWidth={1.8} />
              </IconButton>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <SmallButton onClick={() => duplicateSelection()}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Copy size={13} strokeWidth={1.8} />
                  {t('canvas.duplicate', 'Duplicate')}
                </span>
              </SmallButton>
              <SmallButton danger onClick={() => deleteSelection()}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Trash2 size={13} strokeWidth={1.8} />
                  {t('canvas.delete', 'Delete')}
                </span>
              </SmallButton>
            </div>
          </Section>
        )}

        {selectedConnections.length > 0 && connection && (
          <Section title={t('canvas.tools.connector', 'Connector')}>
            <Swatches
              swatches={STROKE_COLORS}
              value={connection.stroke}
              onPick={(value) => {
                for (const item of selectedConnections) {
                  updateConnection(item.id, { stroke: value }, { history: true, key: 'conn-stroke' })
                }
              }}
            />
            <SliderRow
              label={t('canvas.strokeWidth', 'Width')}
              value={connection.strokeWidth}
              min={0.5}
              max={8}
              step={0.5}
              suffix="px"
              onChange={(value) => {
                for (const item of selectedConnections) {
                  updateConnection(item.id, { strokeWidth: value }, { history: true, key: 'conn-width' })
                }
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <SmallButton
                onClick={() => {
                  for (const item of selectedConnections) {
                    updateConnection(item.id, { arrow: !item.arrow }, { history: true })
                  }
                }}
              >
                {connection.arrow ? '→ arrow' : '— plain line'}
              </SmallButton>
              <SmallButton
                onClick={() => {
                  for (const item of selectedConnections) {
                    updateConnection(item.id, { dashed: !item.dashed }, { history: true })
                  }
                }}
              >
                {connection.dashed ? 'dashed' : 'solid'}
              </SmallButton>
            </div>
          </Section>
        )}

        {hasSelection && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${chrome.border}` }}>
            <SmallButton danger onClick={() => deleteSelection()}>
              {t('canvas.delete', 'Delete selection')}
            </SmallButton>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/*  Small presentational helpers (panel-local)                         */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p
        style={{
          margin: '0 0 6px',
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: chrome.mute,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

function Swatches({
  swatches,
  value,
  onPick,
}: {
  swatches: Swatch[]
  value: string | undefined
  onPick: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {swatches.map((swatch) => {
        const active = value === swatch.value
        const transparent = swatch.value === 'transparent'
        return (
          <button
            key={swatch.value}
            type="button"
            title={swatch.label}
            aria-label={swatch.label}
            onClick={() => onPick(swatch.value)}
            style={{
              width: 21,
              height: 21,
              borderRadius: 6,
              border: `1px solid ${active ? chrome.accentBright : chrome.borderStrong}`,
              background: transparent ? chrome.surface : swatch.value,
              cursor: 'pointer',
              padding: 0,
              backgroundImage: transparent
                ? `linear-gradient(135deg, transparent 44%, ${chrome.mute} 44%, ${chrome.mute} 56%, transparent 56%)`
                : undefined,
              boxShadow: active ? '0 0 0 1px var(--accent, #877ffe)' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        {label && <span style={{ fontSize: 11, color: chrome.mute }}>{label}</span>}
        <span style={{ fontSize: 11, color: chrome.dim, fontVariantNumeric: 'tabular-nums' }}>
          {value}
          {suffix ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: '100%', marginTop: 2, accentColor: chrome.accent }}
      />
    </div>
  )
}

function FontSizeRow({
  value,
  t,
  onChange,
}: {
  value: number
  t: TFunction
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" style={stepButtonStyle} onClick={() => onChange(Math.max(9, value - 1))} title="-">
          −
        </button>
        <span
          style={{
            minWidth: 34,
            textAlign: 'center',
            fontSize: 12,
            color: chrome.soft,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}px
        </span>
        <button type="button" style={stepButtonStyle} onClick={() => onChange(Math.min(160, value + 1))} title="+">
          +
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: chrome.mute }}>
          {t('canvas.fontSize', 'Size')}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 7 }}>
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            style={{
              minWidth: 24,
              height: 22,
              padding: '0 5px',
              borderRadius: 5,
              border: `1px solid ${value === size ? chrome.accent : chrome.border}`,
              background: value === size ? chrome.surface3 : 'transparent',
              color: value === size ? chrome.text : chrome.mute,
              fontSize: 10.5,
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

function SmallButton({
  children,
  danger = false,
  disabled = false,
  onClick,
}: {
  children: ReactNode
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 24,
        padding: '0 8px',
        borderRadius: 6,
        border: `1px solid ${chrome.border}`,
        background: 'transparent',
        color: disabled ? chrome.mute : danger ? chrome.danger : chrome.soft,
        fontSize: 11.5,
        font: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  )
}

function IconButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 28,
        height: 26,
        borderRadius: 6,
        border: `1px solid ${chrome.border}`,
        background: 'transparent',
        color: disabled ? chrome.mute : chrome.soft,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

const stepButtonStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 22,
  height: 22,
  borderRadius: 5,
  border: `1px solid ${chrome.border}`,
  background: 'transparent',
  color: chrome.dim,
  fontSize: 12,
  font: 'inherit',
  cursor: 'pointer',
}
