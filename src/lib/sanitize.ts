/**
 * Minimal HTML sanitizer for user-generated note markup.
 *
 * Notes are rich text stored locally (and can be imported from backup files),
 * so anything that lands in `innerHTML` is filtered down to a small allow-list
 * of formatting tags/attributes. No external dependency required.
 */

const ALLOWED_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'span',
  'a',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'sub',
  'sup',
  'img',
  'div',
])

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'class', 'data-note', 'rel', 'target', 'title'],
  span: ['class', 'data-note'],
  img: ['src', 'alt', 'class', 'width', 'height'],
  '*': ['class', 'data-note'],
}

const SAFE_URL = /^(https?:|mailto:|tel:|data:image\/|#|\/)/i

function sanitizeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  // relative note refs are stored in data-note, not href
  if (trimmed.startsWith('data:') && !trimmed.toLowerCase().startsWith('data:image/')) return null
  return SAFE_URL.test(trimmed) ? trimmed : null
}

function cleanAttributes(el: HTMLElement, tag: string) {
  const allowed = new Set([...(ALLOWED_ATTRS[tag] ?? []), ...(ALLOWED_ATTRS['*'] ?? [])])
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase()
    if (name.startsWith('on') || !allowed.has(name)) {
      el.removeAttribute(attr.name)
    }
  }
  if (tag === 'a') {
    const href = el.getAttribute('href')
    if (href !== null) {
      const safe = sanitizeUrl(href)
      if (safe) {
        el.setAttribute('href', safe)
        if (/^https?:/i.test(safe)) {
          el.setAttribute('target', '_blank')
          el.setAttribute('rel', 'noopener noreferrer')
        }
      } else {
        el.removeAttribute('href')
      }
    }
  }
  if (tag === 'img') {
    const src = el.getAttribute('src')
    const safe = src ? sanitizeUrl(src) : null
    if (safe) el.setAttribute('src', safe)
    else el.remove()
  }
}

function walk(node: Node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
      if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'object' || tag === 'embed' || tag === 'link' || tag === 'meta' || tag === 'form' || tag === 'input') {
        el.remove()
        continue
      }
      if (!ALLOWED_TAGS.has(tag)) {
        // sanitize descendants first, then unwrap unknown container
        walk(el)
        const parent = el.parentNode
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el)
          el.remove()
        }
        continue
      }
      cleanAttributes(el, tag)
      walk(el)
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.remove()
    }
  }
}

/** Returns HTML limited to formatting-only markup. */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  if (typeof document === 'undefined') return ''
  const template = document.createElement('template')
  template.innerHTML = html
  walk(template.content)
  return template.innerHTML
}

/** Plain text extraction (search, word count, previews). */
export function htmlToText(html: string): string {
  if (!html) return ''
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ')
  const template = document.createElement('template')
  template.innerHTML = html
  return (template.content.textContent ?? '').replace(/\s+/g, ' ').trim()
}
