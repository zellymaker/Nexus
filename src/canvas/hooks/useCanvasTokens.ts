/**
 * Resolved theme tokens for Konva content.
 *
 * Konva cannot resolve CSS variables itself, so the values defined in
 * `index.css` are read from the document root and re-read whenever the theme
 * changes. Falls back to the Nexus Dark values when a variable is missing.
 */
import { useEffect, useState } from 'react'

export interface CanvasTokens {
  bgMain: string
  surface: string
  surface2: string
  surface3: string
  border: string
  borderStrong: string
  text: string
  soft: string
  dim: string
  mute: string
  accent: string
  accentBright: string
  danger: string
  success: string
}

const FALLBACKS: CanvasTokens = {
  bgMain: '#1c1d21',
  surface: '#232329',
  surface2: '#26262d',
  surface3: '#2c2e34',
  border: 'rgba(255, 255, 255, 0.075)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  text: '#e9e9ee',
  soft: '#cfcfd6',
  dim: '#a2a2ad',
  mute: '#7c7c87',
  accent: '#877ffe',
  accentBright: '#9d95ff',
  danger: '#ff6b6b',
  success: '#58c78a',
}

const VARIABLES: Record<keyof CanvasTokens, string> = {
  bgMain: '--bg-main',
  surface: '--bg-surface',
  surface2: '--bg-surface-2',
  surface3: '--bg-surface-3',
  border: '--border',
  borderStrong: '--border-strong',
  text: '--text',
  soft: '--text-soft',
  dim: '--text-dim',
  mute: '--text-mute',
  accent: '--accent',
  accentBright: '--accent-bright',
  danger: '--danger',
  success: '--success',
}

function readTokens(): CanvasTokens {
  const root = document.documentElement
  let computed: CSSStyleDeclaration
  try {
    computed = getComputedStyle(root)
  } catch {
    return FALLBACKS
  }
  const tokens = { ...FALLBACKS }
  for (const key of Object.keys(VARIABLES) as Array<keyof CanvasTokens>) {
    const value = computed.getPropertyValue(VARIABLES[key]).trim()
    if (value) tokens[key] = value
  }
  return tokens
}

export function useCanvasTokens(): CanvasTokens {
  const [tokens, setTokens] = useState<CanvasTokens>(readTokens)

  useEffect(() => {
    const root = document.documentElement
    const update = () => setTokens(readTokens())
    const observer = new MutationObserver(update)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'data-density', 'color-scheme'],
    })
    update()
    return () => observer.disconnect()
  }, [])

  return tokens
}
