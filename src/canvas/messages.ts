/**
 * Extra Russian strings for canvas dialogs/toasts. The shared canvas.* keys
 * live in `lib/i18n.ts`; these are canvas-module-specific additions and are
 * registered here so the main i18n pack stays untouched.
 */
import { registerMessages } from '../lib/i18n'

registerMessages('ru', {
  'canvas.confirmDeleteTitle': 'Удалить Canvas «{name}»?',
  'canvas.confirmDeleteBody':
    'Все объекты и связи этого Canvas будут удалены. Действие нельзя отменить.',
  'canvas.exportedToast': 'PNG экспортирован',
  'canvas.selectAllObjects': 'Выбрать все объекты',
  'canvas.connectorArrowOn': 'Со стрелкой',
  'canvas.connectorArrowOff': 'Без стрелки',
  'canvas.connectorDashed': 'Пунктир',
  'canvas.connectorSolid': 'Сплошная линия',
  'canvas.paste': 'Вставить',
  'canvas.copy': 'Копировать',
})

export {}
