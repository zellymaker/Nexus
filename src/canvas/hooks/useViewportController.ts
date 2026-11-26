/**
 * Viewport controller for the canvas: local state for smooth pan/zoom, synced
 * to the persisted canvas document (debounced), plus animated fit / reset /
 * focus helpers.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { CanvasDoc, Viewport } from '../types'
import { useCanvasStore } from '../store'
import { centerBounds, fitBounds, objectBounds, screenToWorld, zoomAt } from '../utils/geometry'
import { contentBounds } from '../utils/connections'

const VIEWPORT_SYNC_DELAY = 250
const ANIMATION_MS = 170

/** Screen space covered by the floating tool dock / properties panel. */
const FIT_INSETS = { left: 56, right: 268, top: 12, bottom: 16 }

function contentArea(size: { width: number; height: number }) {
  return {
    x: FIT_INSETS.left,
    y: FIT_INSETS.top,
    width: Math.max(160, size.width - FIT_INSETS.left - FIT_INSETS.right),
    height: Math.max(160, size.height - FIT_INSETS.top - FIT_INSETS.bottom),
  }
}

export interface ViewportController {
  viewport: Viewport
  /** Latest viewport without waiting for a re-render (used by stage handlers). */
  viewportRef: RefObject<Viewport>
  onViewportChange: (viewport: Viewport) => void
  cancelAnimation: () => void
  zoomIn: () => void
  zoomOut: () => void
  fitToContent: () => void
  resetZoom: () => void
  focusObject: (objectId: string) => void
}

export function useViewportController(
  canvas: CanvasDoc | null,
  activeCanvasId: string,
  size: { width: number; height: number },
): ViewportController {
  const [viewport, setViewport] = useState<Viewport>(
    () => canvas?.viewport ?? { x: 0, y: 0, scale: 1 },
  )
  const viewportRef = useRef<Viewport>(viewport)
  const sizeRef = useRef(size)
  sizeRef.current = size
  const animationRef = useRef<number | null>(null)
  const animationTargetRef = useRef<Viewport | null>(null)
  const syncRef = useRef<number | undefined>(undefined)
  const activeIdRef = useRef(activeCanvasId)
  activeIdRef.current = activeCanvasId

  const applyViewport = useCallback((next: Viewport) => {
    viewportRef.current = next
    setViewport(next)
  }, [])

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    animationTargetRef.current = null
  }, [])

  const onViewportChange = useCallback(
    (next: Viewport) => {
      cancelAnimation()
      applyViewport(next)
    },
    [applyViewport, cancelAnimation],
  )

  const animateTo = useCallback(
    (target: Viewport) => {
      cancelAnimation()
      animationTargetRef.current = target
      const from = viewportRef.current
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / ANIMATION_MS)
        const ease = 1 - Math.pow(1 - progress, 3)
        if (progress >= 1) {
          animationRef.current = null
          animationTargetRef.current = null
          applyViewport(target)
          return
        }
        applyViewport({
          x: from.x + (target.x - from.x) * ease,
          y: from.y + (target.y - from.y) * ease,
          scale: from.scale + (target.scale - from.scale) * ease,
        })
        animationRef.current = window.requestAnimationFrame(step)
      }
      animationRef.current = window.requestAnimationFrame(step)
    },
    [applyViewport, cancelAnimation],
  )

  /* Load the persisted viewport whenever the active canvas changes. */
  useEffect(() => {
    const state = useCanvasStore.getState()
    const doc = state.canvases.find((item) => item.id === state.activeCanvasId)
    if (!doc) return
    cancelAnimation()
    applyViewport(doc.viewport)
  }, [activeCanvasId, applyViewport, cancelAnimation])

  /* Persist the viewport (debounced) into the canvas document. */
  useEffect(() => {
    if (!activeCanvasId) return
    window.clearTimeout(syncRef.current)
    syncRef.current = window.setTimeout(() => {
      useCanvasStore.getState().setViewport(viewportRef.current)
    }, VIEWPORT_SYNC_DELAY)
    return () => window.clearTimeout(syncRef.current)
  }, [viewport, activeCanvasId])

  /* Flush on unmount so a view switch doesn't lose the last pan. */
  useEffect(
    () => () => {
      window.clearTimeout(syncRef.current)
      cancelAnimation()
      if (activeIdRef.current) {
        useCanvasStore.getState().setViewport(viewportRef.current)
      }
    },
    [cancelAnimation],
  )

  const activeCanvasNow = useCallback((): CanvasDoc | null => {
    const state = useCanvasStore.getState()
    return state.canvases.find((item) => item.id === state.activeCanvasId) ?? null
  }, [])

  const zoomBy = useCallback(
    (factor: number) => {
      const current = animationTargetRef.current ?? viewportRef.current
      const area = contentArea(sizeRef.current)
      const center = { x: area.x + area.width / 2, y: area.y + area.height / 2 }
      animateTo(zoomAt(current, current.scale * factor, center))
    },
    [animateTo],
  )

  const fitToContent = useCallback(() => {
    const doc = activeCanvasNow()
    if (!doc) return
    const bounds = contentBounds(doc.objects, doc.connections)
    const area = contentArea(sizeRef.current)
    const fitted = fitBounds(bounds, area, 56)
    animateTo({ scale: fitted.scale, x: area.x + fitted.x, y: area.y + fitted.y })
  }, [activeCanvasNow, animateTo])

  const resetZoom = useCallback(() => {
    const current = animationTargetRef.current ?? viewportRef.current
    const area = contentArea(sizeRef.current)
    const center = { x: area.x + area.width / 2, y: area.y + area.height / 2 }
    const world = screenToWorld(current, center)
    animateTo({ x: center.x - world.x, y: center.y - world.y, scale: 1 })
  }, [animateTo])

  const focusObject = useCallback(
    (objectId: string) => {
      const doc = activeCanvasNow()
      const object = doc?.objects.find((item) => item.id === objectId)
      if (!object) return
      useCanvasStore.getState().select([objectId])
      const area = contentArea(sizeRef.current)
      const fitted = centerBounds(objectBounds(object), area, 1.4)
      animateTo({ scale: fitted.scale, x: area.x + fitted.x, y: area.y + fitted.y })
    },
    [activeCanvasNow, animateTo],
  )

  return {
    viewport,
    viewportRef,
    onViewportChange,
    cancelAnimation,
    zoomIn: () => zoomBy(1.2),
    zoomOut: () => zoomBy(1 / 1.2),
    fitToContent,
    resetZoom,
    focusObject,
  }
}
