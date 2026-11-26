/** Relative time, word counts and other small derived formatters. */
import type { WsNode } from './store'
import { countWords } from './store'
import type { TFunction } from './messages'
import type { Language } from './settings'

export function relativeTime(timestamp: number, now = Date.now()): { v: number; unit: 'min' | 'hour' | 'day' } {
  const diff = Math.max(0, now - timestamp)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return { v: 0, unit: 'min' }
  if (min < 60) return { v: min, unit: 'min' }
  const hours = Math.floor(min / 60)
  if (hours < 24) return { v: hours, unit: 'hour' }
  return { v: Math.floor(hours / 24), unit: 'day' }
}

export function formatRelative(timestamp: number, t: TFunction): string {
  const { v, unit } = relativeTime(timestamp)
  if (v === 0) return t('doc.justNow', 'just now')
  if (unit === 'min') return t('doc.minutesAgo', '{n} min ago').replace('{n}', String(v))
  if (unit === 'hour') return t('doc.hoursAgo', '{n} h ago').replace('{n}', String(v))
  return t('doc.daysAgo', '{n} d ago').replace('{n}', String(v))
}

const localeFor = (lang: Language) => (lang === 'ru' ? 'ru-RU' : 'en-US')

export function formatDate(timestamp: number, lang: Language = 'en'): string {
  return new Date(timestamp).toLocaleDateString(localeFor(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(timestamp: number, lang: Language = 'en'): string {
  return new Date(timestamp).toLocaleString(localeFor(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function wordCountOf(node: WsNode | undefined): number {
  return node?.content ? countWords(node.content) : 0
}

export function wordCountLabel(node: WsNode | undefined, t: TFunction): string {
  const count = wordCountOf(node)
  const words = t('editor.words', 'words')
  return `${count.toLocaleString()} ${words}`
}
