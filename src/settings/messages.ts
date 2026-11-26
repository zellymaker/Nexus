/**
 * Russian strings owned by the Settings module.
 *
 * `src/lib/i18n.ts` already registers the shared `settings.*` keys; this pack
 * only adds the extra labels the full Settings section needs. English text is
 * always passed inline as the fallback at the call site, so the English build
 * works without a second dictionary.
 *
 * Modules register their own packs with `registerMessages('ru', { … })` —
 * `src/lib/i18n.ts` is not edited from this module.
 */
import { registerMessages } from '../lib/messages'

/* ------------------------------------------------------------------ */
/*  Keyboard shortcut labels (SHORTCUT_DEFS ids)                       */
/* ------------------------------------------------------------------ */

const SHORTCUT_LABELS: Record<string, string> = {
  'create-note': 'Создать заметку',
  'create-folder': 'Создать папку',
  'create-canvas': 'Создать Canvas',
  'delete-selection': 'Удалить выбранное',
  'rename-selection': 'Переименовать выбранное',
  'duplicate-selection': 'Дублировать выбранное',
  'save-document': 'Сохранить документ',
  undo: 'Отменить',
  redo: 'Повторить',
  'toggle-sidebar': 'Показать или скрыть левую панель',
  palette: 'Палитра команд',
  'quick-search': 'Быстрый поиск',
  'close-tab': 'Закрыть вкладку',
  'next-tab': 'Следующая вкладка',
  'prev-tab': 'Предыдущая вкладка',
  'open-settings': 'Открыть настройки',
  'close-modal': 'Закрыть окно или палитру',
  'canvas-select': 'Canvas: инструмент выбора',
  'canvas-hand': 'Canvas: перемещение холста',
  'canvas-sticky': 'Canvas: стикер',
  'canvas-text': 'Canvas: текст',
  'canvas-shape': 'Canvas: фигура',
  'canvas-connector': 'Canvas: соединитель',
  'canvas-draw': 'Canvas: рисование',
  'canvas-image': 'Canvas: изображение',
  'canvas-document': 'Canvas: карточка документа',
  'canvas-eraser': 'Canvas: ластик',
  'canvas-delete': 'Canvas: удалить выбранное',
  'canvas-group': 'Canvas: группировать',
  'canvas-ungroup': 'Canvas: разгруппировать',
  'canvas-center': 'Canvas: вписать содержимое',
  'canvas-reset-zoom': 'Canvas: сбросить масштаб',
  'canvas-search': 'Canvas: поиск объектов',
}

/* ------------------------------------------------------------------ */
/*  Settings section                                                   */
/* ------------------------------------------------------------------ */

const MESSAGES: Record<string, string> = {
  /* section nav / subtitles ---------------------------------------- */
  'settings.sectionNav': 'Разделы настроек',
  'settings.desc.general': 'Язык, сохранение, запуск и уведомления',
  'settings.desc.appearance': 'Тема, масштаб, плотность и движение',
  'settings.desc.typography': 'Шрифты и типографика интерфейса',
  'settings.desc.editor': 'Как выглядит и ведёт себя редактор заметок',
  'settings.desc.workspace': 'Проводник, сортировка и Canvas',
  'settings.desc.privacy': 'Локальные данные, диагностика и резервные копии',
  'settings.desc.shortcuts': 'Клавиатурные комбинации и конфликты',
  'settings.desc.about': 'Версия, технологии и лицензии',

  /* group headings -------------------------------------------------- */
  'settings.group.language': 'Язык',
  'settings.group.behavior': 'Поведение',
  'settings.group.autosave': 'Сохранение',
  'settings.group.notifications': 'Уведомления',
  'settings.group.dangerZone': 'Сброс',
  'settings.group.theme': 'Тема оформления',
  'settings.group.interface': 'Интерфейс',
  'settings.group.motion': 'Движение',
  'settings.group.fonts': 'Шрифты',
  'settings.group.text': 'Размер текста',
  'settings.group.preview': 'Предпросмотр',
  'settings.group.display': 'Отображение',
  'settings.group.cursor': 'Курсор и отступы',
  'settings.group.explorer': 'Проводник',
  'settings.group.canvas': 'Canvas',
  'settings.group.storage': 'Локальное хранилище',
  'settings.group.privacy': 'Приватность',
  'settings.group.diagnostics': 'Диагностика',
  'settings.group.backup': 'Резервные копии',
  'settings.group.permissions': 'Разрешения приложения',
  'settings.group.cleanup': 'Очистка',
  'settings.group.commands': 'Команды',
  'settings.group.version': 'Версия',
  'settings.group.tech': 'Технологии',
  'settings.group.licenses': 'Лицензии',
  'settings.group.app': 'Приложение',

  /* general --------------------------------------------------------- */
  'settings.autosaveHint': 'Сохранять изменения заметок автоматически',
  'settings.autosaveDelayHint': 'Задержка после последнего изменения',
  'settings.startupHint':
    'Восстанавливать сессию — открыть вкладки прошлого запуска; Главная — начать с домашнего экрана',
  'settings.confirmDeleteHint': 'Спрашивать подтверждение перед удалением заметок и папок',
  'settings.notificationsHint': 'Показывать всплывающие уведомления о действиях',
  'settings.toastDurationHint': 'Сколько уведомление остаётся на экране',
  'settings.durationNever': 'Не скрывать',
  'settings.unit.ms': 'мс',
  'settings.unit.sec': 'с',
  'settings.resetAllHint':
    'Тема, шрифты, редактор, проводник и горячие клавиши вернутся к значениям по умолчанию. Заметки не изменятся.',
  'settings.resetConfirmTitle': 'Сбросить все настройки?',
  'settings.resetConfirmDesc':
    'Пользовательские настройки будут заменены значениями по умолчанию. Заметки, вкладки и Canvas останутся на месте.',
  'settings.languagePreserved': 'Язык интерфейса сохраняется',

  /* appearance ------------------------------------------------------ */
  'settings.themeHint': 'Тема применяется сразу и запоминается между запусками',
  'settings.themeNow': 'Сейчас: {name}',
  'settings.themeSystemHint':
    'Следует настройке оформления операционной системы и переключается автоматически',
  'settings.uiScaleHint': 'Масштаб всей оболочки приложения',
  'settings.densityHint': 'Отступы и высота строк в списках и панелях',
  'settings.motionHint':
    '«Как в системе» учитывает prefers-reduced-motion — системную настройку уменьшения движения',
  'settings.motionSystemNow': 'Системная настройка: {state}',
  'settings.motionState.reduced': 'движение уменьшено',
  'settings.motionState.full': 'движение включено',
  'settings.motionEffective.reduced': 'Сейчас анимации отключены',
  'settings.motionEffective.full': 'Сейчас анимации включены',
  'settings.motionAnimationsOff': 'Анимации выключены — движение отключено для всего интерфейса',

  /* typography ------------------------------------------------------ */
  'settings.fontHint': 'Если шрифта нет в системе, используется запасной шрифт',
  'settings.fontMissing': 'Шрифт не найден в системе — будет использован запасной',
  'settings.fontMissingShort': 'Нет в системе',
  'settings.baseSizeHint': 'Базовый размер текста интерфейса, {n} px',
  'settings.lineHeightHint': 'Множитель высоты строки текста интерфейса',
  'settings.fontWeightHint': 'Насыщенность основного текста интерфейса',
  'settings.previewHeading': 'Заметки — продолжение мышления',
  'settings.previewSample':
    'Съешь же ещё этих мягких французских булок, да выпей чаю. 1234567890',
  'settings.previewMono': 'const idea = connect(note, canvas)',
  'settings.previewUi': 'Интерфейс · Меню · Панель',
  'settings.previewEditor': 'Редактор · Текст заметки',

  /* editor ---------------------------------------------------------- */
  'settings.editorFontSizeHint': 'Кегль текста в редакторе, {n} px',
  'settings.editorLineHeightHint': 'Межстрочный интервал в редакторе',
  'settings.editorWrapHint': 'Переносить длинные строки по ширине редактора',
  'settings.editorLineNumbersHint': 'Показывать номера строк слева от текста',
  'settings.editorHighlightHint': 'Подсвечивать Markdown-разметку и ссылки',
  'settings.cursorHint': 'Как выглядит каретка в редакторе',
  'settings.tabSizeHint': 'Ширина символа табуляции',
  'settings.editorPreviewTitle': 'Предпросмотр редактора',

  /* workspace ------------------------------------------------------- */
  'settings.sortFilesHint': 'Порядок заметок внутри папок и списков',
  'settings.sortFoldersHint': 'Порядок папок в проводнике',
  'settings.showHiddenHint': 'Показывать папки и заметки со скрытыми именами',
  'settings.expandOnClickHint': 'Один клик по папке раскрывает её содержимое',
  'settings.revealActiveHint': 'Прокручивать проводник к открытой заметке',
  'settings.canvasInfo':
    'Canvas сохраняется автоматически в локальное хранилище. Отдельных настроек Canvas пока нет: он использует тему, шрифты и масштаб интерфейса.',
  'settings.canvasKey': 'Ключ хранения: nexus:canvas:v1',
  'settings.canvasHint': 'Сочетания клавиш Canvas перечислены в разделе «Горячие клавиши».',
  'settings.openCanvas': 'Открыть Canvas',

  /* privacy --------------------------------------------------------- */
  'settings.storageSize': 'Занято в localStorage',
  'settings.storageKeysLabel': 'Ключей NEXUS: {n}',
  'settings.storageRefresh': 'Обновить',
  'settings.storageEmpty': 'Данных пока нет',
  'settings.storagePrivacyNote':
    'Все данные NEXUS хранятся только в локальном хранилище этого приложения на этом компьютере.',
  'settings.noTelemetryDesc':
    'NEXUS не собирает и не отправляет телеметрию, аналитику или отчёты об использовании.',
  'settings.noNetworkDesc':
    'Содержимое заметок, настройки и данные Canvas не покидают этот компьютер.',
  'settings.localStorageDesc':
    'Заметки, настройки и Canvas хранятся в localStorage WebView под ключами с префиксом nexus:',
  'settings.permissionsHint':
    'NEXUS использует только окно, localStorage WebView и запись в буфер обмена по действию пользователя; доступа к файловой системе, сети и shell нет.',
  'settings.permissions.filesystem': 'Доступ к файловой системе',
  'settings.permissions.network': 'Сетевые запросы',
  'settings.permissions.window': 'Окно приложения',
  'settings.permissions.clipboard': 'Буфер обмена',
  'settings.permissions.storage': 'Локальное хранилище WebView (localStorage)',
  'settings.permissions.camera': 'Камера и микрофон',
  'settings.permissions.location': 'Геолокация',
  'settings.permissions.yes': 'Да',
  'settings.permissions.no': 'Нет',
  'settings.permissions.writeOnly': 'Только запись, по действию пользователя',
  'settings.permissions.windowNote': 'Заголовок, размер, максимизация и перетаскивание окна',
  'settings.permissions.storageNote': 'Заметки, настройки и Canvas остаются в localStorage WebView',
  'settings.permissions.clipboardNote':
    'Только запись, по нажатию кнопки: сведения о версии и ссылки на заметки',
  'settings.permissions.filesystemNote':
    'Нет доступа: бэкап сохраняется как Blob download, без API файловой системы',
  'settings.permissions.networkNote': 'Нет HTTP-запросов: заметки и настройки никуда не отправляются',
  'settings.permissions.shell': 'Оболочка и команды ОС',
  'settings.permissions.shellNote': 'Нет доступа к процессам, shell и командам ОС',

  /* diagnostics ----------------------------------------------------- */
  'settings.diagnosticsPathsHint': 'Добавлять пути и идентификаторы в записи (по умолчанию выключено)',
  'settings.diagnosticsCount': 'Записей: {n}',
  'settings.diagnosticsDisabled':
    'Диагностика выключена — новые записи не собираются. Ранее собранные записи остаются в памяти до перезапуска.',
  'settings.diagnosticsCleared': 'Диагностика очищена',
  'settings.diagnosticsRefresh': 'Обновить',

  /* backup ---------------------------------------------------------- */
  'settings.backupExport': 'Экспорт в JSON',
  'settings.backupImport': 'Импорт из JSON',
  'settings.backupExportHint':
    'Скачать все данные NEXUS — заметки, настройки и Canvas — в один JSON-файл',
  'settings.backupImportHint':
    'Восстановить данные из файла резервной копии. Приложение перезагрузится.',
  'settings.backupInvalid': 'Файл не является резервной копией NEXUS',
  'settings.backupInvalidStore': 'В резервной копии повреждены данные рабочего пространства или Canvas',
  'settings.backupEmpty': 'В резервной копии нет данных для импорта',
  'settings.backupTooLarge': 'Резервная копия слишком большая: {size}. Максимум — 50 МБ.',
  'settings.backupLimit': 'Максимальный размер файла — 50 МБ.',
  'settings.backupLocalOnly':
    'Файл создаётся локально через Blob и скачивается на диск — никуда не отправляется.',
  'settings.backupCanvasSkipped':
    'Данные Canvas в копии повреждены и не будут импортированы — текущий Canvas останется без изменений.',
  'settings.backupSanitizedInfo':
    'При импорте очищена небезопасная разметка заметок: {notes}. Исправлено настроек: {adjusted}.',
  'settings.backupConfirmTitle': 'Импортировать резервную копию?',
  'settings.backupConfirmDesc':
    'Текущие данные NEXUS будут заменены данными из файла ({n} ключей). После импорта приложение перезагрузится.',
  'settings.backupApply': 'Импортировать',
  'settings.backupExported': 'Резервная копия сохранена',
  'settings.backupKeys': 'Ключей: {n}',
  'settings.backupImportFailed': 'Не удалось прочитать файл: {message}',
  'settings.backupReloading': 'Данные записаны — перезагрузка приложения…',

  /* cleanup --------------------------------------------------------- */
  'settings.clearTemp': 'Очистить временные данные',
  'settings.clearTempHint': 'Записи диагностики и все активные уведомления этой сессии',
  'settings.clearTempTitle': 'Очистить временные данные?',
  'settings.clearTempDesc':
    'Будут удалены записи диагностики и активные уведомления. Заметки, настройки и Canvas не затрагиваются.',
  'settings.clearTempDone': 'Временные данные очищены',

  /* shortcuts ------------------------------------------------------- */
  'settings.shortcutsSearchEmpty': 'Команды не найдены',
  'settings.shortcutsRecord': 'Назначить новое сочетание',
  'settings.shortcutsRecording': 'Нажмите новую комбинацию…',
  'settings.shortcutsCount': 'Команд: {n}',
  'settings.shortcutsDefaultIs': 'По умолчанию: {binding}',
  'settings.shortcutsChanged': 'изменено',
  'settings.shortcutsSaved': 'Сочетание обновлено',
  'settings.shortcutsResetOne': 'Сбросить сочетание',
  'settings.shortcutsResetOneDone': 'Сочетание сброшено',
  'settings.shortcutsResetDone': 'Сочетания по умолчанию восстановлены',
  'settings.shortcutsConflictScope':
    'Показываются только конфликты в рамках одной области: сочетания Canvas действуют только на холсте.',
  'settings.shortcutsConflictToast': 'Комбинация {binding} уже занята: {names}',
  'settings.shortcutsRecordingHint': 'Нажмите любую комбинацию. Esc — отмена.',
  'settings.shortcuts.group.workspace': 'Рабочее пространство',
  'settings.shortcuts.group.navigation': 'Навигация',
  'settings.shortcuts.group.editor': 'Редактор',
  'settings.shortcuts.group.canvas': 'Canvas',
  'settings.shortcuts.group.app': 'Приложение',
  'settings.shortcuts.emptyGroup': 'Команд в этой группе нет',

  /* about ----------------------------------------------------------- */
  'settings.about.appVersion': 'Версия приложения',
  'settings.about.tauriVersion': 'Tauri',
  'settings.about.runtime': 'Среда выполнения',
  'settings.about.runtimeValue': 'WebView через Tauri (WebKitGTK / WebView2)',
  'settings.about.license': 'Лицензия',
  'settings.about.copy': 'Скопировать сведения',
  'settings.about.copied': 'Сведения скопированы',
  'settings.about.copyFailed': 'Не удалось скопировать в буфер обмена',
  'settings.about.licensesHint': 'Сторонние библиотеки распространяются по открытым лицензиям.',
  'settings.about.techHint': 'Стек, на котором собран интерфейс NEXUS',
  'settings.about.offline': 'Работает полностью офлайн',
  'settings.about.localOnly': 'Без аккаунтов и облачной синхронизации',
}

registerMessages('ru', {
  ...MESSAGES,
  ...Object.fromEntries(
    Object.entries(SHORTCUT_LABELS).map(([id, label]) => [`shortcut.${id}`, label]),
  ),
  /* fix a typo in the shared pack */
  'settings.shortcutRecord': 'Нажмите новую комбинацию…',
})
