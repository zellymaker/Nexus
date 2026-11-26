/**
 * Small React hooks shared by the Settings sections.
 *
 * Kept apart from `widgets.tsx` so component modules stay fast-refresh friendly.
 */
import { useEffect, useState } from 'react'
import { systemPrefersReducedMotion, watchSystemPreferences } from '../lib/theme'
import { isFontAvailable } from './utils'

/* ------------------------------------------------------------------ */
/*  System preference hooks                                            */
/* ------------------------------------------------------------------ */

/** Live `prefers-reduced-motion` value. */
export function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => systemPrefersReducedMotion())
  useEffect(() => {
    const update = () => setReduced(systemPrefersReducedMotion())
    update()
    return watchSystemPreferences(update)
  }, [])
  return reduced
}

/**
 * Refresh font availability after the bundled fonts finish loading, so the
 * fallback warning never flashes a false positive.
 */
export function useUnavailableFonts(families: string[]): string[] {
  const signature = families.join('|')
  const [missing, setMissing] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    const check = () => {
      if (!alive) return
      const next = families.filter((family) => !isFontAvailable(family))
      setMissing((current) =>
        current.length === next.length && current.every((value, index) => value === next[index])
          ? current
          : next,
      )
    }
    check()
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(check).catch(() => undefined)
    }
    const timer = window.setTimeout(check, 700)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [signature]) // eslint-disable-line react-hooks/exhaustive-deps

  return missing
}
