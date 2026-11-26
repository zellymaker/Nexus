/**
 * Canvas chrome styling helpers.
 *
 * Chrome must follow the active NEXUS theme, so every colour here is a CSS
 * variable with the dark-theme value as fallback. That keeps the canvas
 * consistent even before a variable is defined (or in an older theme pack).
 *
 * Content colours (stickies / shapes / ink) live in `palette.ts` and are fixed.
 */
import type { CSSProperties } from 'react'

export const chrome = {
  app: 'var(--bg-app, #0e0f13)',
  main: 'var(--bg-main, #1c1d21)',
  surface: 'var(--bg-surface, #232329)',
  surface2: 'var(--bg-surface-2, #26262d)',
  surface3: 'var(--bg-surface-3, #2c2e34)',
  input: 'var(--bg-input, #26272c)',
  toolbar: 'var(--bg-toolbar, #222228)',
  border: 'var(--border, rgba(255, 255, 255, 0.075))',
  borderStrong: 'var(--border-strong, rgba(255, 255, 255, 0.13))',
  text: 'var(--text, #e9e9ee)',
  soft: 'var(--text-soft, #c9c9d1)',
  dim: 'var(--text-dim, #a2a2ad)',
  mute: 'var(--text-mute, #7c7c87)',
  accent: 'var(--accent, #877ffe)',
  accentBright: 'var(--accent-bright, #9d95ff)',
  accentSoft: 'var(--accent-soft, #6f68c9)',
  danger: 'var(--danger, #ff6b81)',
  success: 'var(--success, #7bd88f)',
  warn: 'var(--warn, #e0b45f)',
  hover: 'var(--bg-hover, var(--hover, rgba(255, 255, 255, 0.055)))',
  hoverStrong: 'var(--bg-hover-strong, rgba(255, 255, 255, 0.09))',
  shadowPalette: 'var(--shadow-palette, 0 32px 80px -16px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.055))',
} as const

export const canvasBackground = 'var(--bg-main, #1c1d21)'
export const canvasGridDot = 'var(--canvas-grid, rgba(255, 255, 255, 0.05))'
export const fontStack = "'Inter Variable', Inter, system-ui, sans-serif"

export const panelStyle: CSSProperties = {
  background: chrome.toolbar,
  border: `1px solid ${chrome.border}`,
  borderRadius: 10,
  boxShadow: '0 14px 36px -18px rgba(0, 0, 0, 0.65)',
}

export const floatingPanelStyle: CSSProperties = {
  background: chrome.surface2,
  border: `1px solid ${chrome.border}`,
  borderRadius: 10,
  boxShadow: '0 24px 60px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.12)',
}

export function iconButtonStyle(active = false, disabled = false): CSSProperties {
  return {
    display: 'grid',
    placeItems: 'center',
    width: 26,
    height: 26,
    flexShrink: 0,
    borderRadius: 6,
    border: 'none',
    background: active ? chrome.surface3 : 'transparent',
    color: active ? chrome.text : disabled ? chrome.mute : chrome.dim,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 120ms ease, color 120ms ease',
  }
}

export function textButtonStyle(active = false, disabled = false): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 26,
    padding: '0 9px',
    borderRadius: 7,
    border: `1px solid ${active ? chrome.borderStrong : 'transparent'}`,
    background: active ? chrome.surface3 : 'transparent',
    color: disabled ? chrome.mute : active ? chrome.text : chrome.soft,
    font: 'inherit',
    fontSize: 12.5,
    fontWeight: 500,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    whiteSpace: 'nowrap',
    transition: 'background-color 120ms ease, color 120ms ease',
  }
}

export const inputStyle: CSSProperties = {
  height: 28,
  width: '100%',
  borderRadius: 7,
  border: `1px solid ${chrome.border}`,
  background: chrome.input,
  color: chrome.text,
  fontSize: 13,
  padding: '0 9px',
  outline: 'none',
  font: 'inherit',
}

export const labelStyle: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: chrome.mute,
}

export const menuStyle: CSSProperties = {
  ...floatingPanelStyle,
  position: 'fixed',
  zIndex: 60,
  minWidth: 196,
  padding: 5,
}

export function menuItemStyle(danger = false, disabled = false): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 28,
    padding: '0 8px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: danger ? chrome.danger : disabled ? chrome.mute : chrome.soft,
    fontSize: 12.5,
    font: 'inherit',
    textAlign: 'left',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    whiteSpace: 'nowrap',
  }
}

export const menuDividerStyle: CSSProperties = {
  height: 1,
  margin: '4px 6px',
  background: chrome.border,
}

export const tooltipStyle: CSSProperties = {
  fontSize: 11.5,
  color: chrome.mute,
  fontVariantNumeric: 'tabular-nums',
}
