import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/** Tracks the content-box size of an element (ResizeObserver). */
export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = (width: number, height: number) => {
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      )
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(
        Math.max(1, Math.round(entry.contentRect.width)),
        Math.max(1, Math.round(entry.contentRect.height)),
      )
    })
    observer.observe(element)
    update(Math.max(1, element.clientWidth), Math.max(1, element.clientHeight))
    return () => observer.disconnect()
  }, [ref])

  return size
}

/** Current window size — used to keep floating overlays inside the viewport. */
export function useWindowSize(): ElementSize {
  const [size, setSize] = useState<ElementSize>(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
  }))

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}
