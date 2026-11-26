/**
 * First-run content for the canvas board.
 *
 * Seeded once into `nexus:canvas:v1`; afterwards the persisted state wins and
 * users can delete everything without the seed coming back.
 */
import type { Bounds, CanvasDoc, CanvasObject, Connection, StickyObject, TextObject } from './types'
import { createDocumentObject, createObject, uid } from './utils/objects'
import { makeConnection } from './utils/connections'
import { DEFAULT_STICKY_FILL } from './palette'

function sticky(bounds: Bounds, text: string, fill: string = DEFAULT_STICKY_FILL): CanvasObject {
  const base = createObject('sticky', bounds) as StickyObject
  return { ...base, text, fill }
}

function label(bounds: Bounds, text: string, fontSize: number, bold = false): CanvasObject {
  const base = createObject('text', bounds) as TextObject
  return { ...base, text, fontSize, bold }
}

function makeCanvas(
  name: string,
  objects: CanvasObject[],
  connections: Connection[],
): CanvasDoc {
  const now = Date.now()
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    objects,
    connections,
    viewport: { x: 0, y: 0, scale: 1 },
  }
}

function ideasCanvas(): CanvasDoc {
  const heading = label({ x: 120, y: 64, width: 360, height: 48 }, 'Q4 Vision', 34, true)
  const research = sticky(
    { x: 120, y: 140, width: 230, height: 150 },
    'Research → prototype → test\n\nOne outcome per sprint.',
    '#f3e6a4',
  )
  const notes = sticky(
    { x: 392, y: 118, width: 230, height: 150 },
    'Turn scattered notes into a shared visual plan.',
    '#d8cdf6',
  )
  const frame = createObject('rect', { x: 120, y: 336, width: 250, height: 148 })
  const frameLabel = label({ x: 144, y: 386, width: 210, height: 60 }, 'Workspace\ncanvas', 18)
  const document = createDocumentObject('second-brain', { x: 560, y: 410 }, { width: 260, height: 92 })

  const objects = [heading, research, notes, frame, frameLabel, document]
  const connections = [
    makeConnection(research, notes),
    makeConnection(notes, document),
    makeConnection(frame, document),
  ]
  return makeCanvas('Ideas', objects, connections)
}

function roadmapCanvas(): CanvasDoc {
  const heading = label({ x: 120, y: 64, width: 320, height: 48 }, 'Roadmap', 34, true)
  const now = sticky({ x: 120, y: 148, width: 200, height: 130 }, 'Now\n\nInfinite canvas\nNote cards', '#c7e8d4')
  const next = sticky({ x: 380, y: 148, width: 200, height: 130 }, 'Next\n\nTemplates\nGrid snapping', '#c3dcf5')
  const later = sticky({ x: 640, y: 148, width: 200, height: 130 }, 'Later\n\nRealtime\ncollaboration', '#f6d5b8')
  const document = createDocumentObject('projects-overview', { x: 380, y: 390 }, { width: 260, height: 92 })

  const objects = [heading, now, next, later, document]
  const connections = [makeConnection(now, next), makeConnection(next, later)]
  return makeCanvas('Roadmap', objects, connections)
}

export function createSeedCanvases(): CanvasDoc[] {
  return [ideasCanvas(), roadmapCanvas()]
}
