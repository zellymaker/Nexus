# NEXUS — аудит безопасности и приватности

**Снимок:** 2026-11-26 04:48 +05:00, `HEAD bd24415` (baseline), рабочее дерево грязное: параллельно идёт интеграция settings/canvas.
**Важно:** репозиторий менялся во время аудита (04:30–04:48). При первом чтении в 04:33 `app.security.csp` был `null`; к 04:40–04:45 в рабочем дереве уже появились CSP, `devCsp`, минимальные capabilities, HTML-санитайзер, санитизация импорта store и валидация persisted state. Ниже — проверка **актуального** состояния; исправленное отмечено отдельно. Если эти правки не попадут в коммит — соответствующие findings возвращаются.

Аудит read-only: файлы не изменялись. Выполнялись чтение, `git`-команды, `strings`, grep, `tsc --noEmit --incremental false` (без записи). Сборка/запуск приложения не выполнялись.

---

## 1. Резюме

В коде **нет телеметрии, аналитики, трекеров, сетевых вызовов** и **нет идентификаторов пользователя/устройства**. Содержимое заметок не передаётся в Rust/IPC; нет плагинов `fs`, `shell`, `opener`, `updater`, нет кастомных Tauri-команд и asset protocol. Это сильная сторона решения и главный вывод по приватности.

Во время аудита уже исправлены: CSP (была `null`), `devCsp`, `core:default` → минимальные window-права, санитайзер HTML для paste/load, санитизация workspace при импорте backup, базовая валидация persisted state. Это правильные направления.

Текущие открытые вопросы:

1. **High (release/integrity):** `src-tauri/target/release/nexus` (04:11) — не self-contained: в нём нет встроенного фронтенда, зато есть `http://localhost:5173` и 212 путей `/home/zelly`. Похоже на dev-сборку/сборку без `tauri build`; такой артефакт нельзя отдавать.
2. **Medium:** санитайзер `sanitizeHtml` имеет обход через неизвестный контейнер (`<foo><img onerror=…></foo>`): потомки не обходятся после unwrap; плюс нет `onDrop`, а `a[href]` разрешает `data:image/svg+xml`. CSP сейчас блокирует выполнение JS в production, поэтому это defense-in-depth, а не готовый XSS.
3. **Medium:** импорт backup санитизирует `nexus:store:v1`, но **не валидирует `nexus:canvas:v1`**, не проверяет `settings.language`, нет лимита размера и нет сообщения, сколько заметок было изменено. `sanitizeBackupStore` есть — это уже лучше, чем было.
4. **Medium (release/integrity):** `tsc` и `pnpm build` на 04:47 уже проходят, но `src-tauri/target/release/nexus` (04:11) устарел и, похоже, собран в dev-режиме; `dist` от 04:47 актуален. Перед релизом нужна финальная `tauri build` и проверка offline.
5. **Low:** title интерполируется в HTML; нет navigation guard для внешних ссылок; после удаления `core:default` не добавлен `core:window:allow-internal-toggle-maximize` (double-click maximize не работает); UI приватности всё ещё говорит «filesystem: no» / «clipboard: write only»; release-бинарник содержит build-пути; `.gitignore` не закрывает `.env*`/ключи; license/version-метаданные неполные.

**Вердикт по разделу 4 ТЗ:** приватность (4.1) — в основном **выполнена**; безопасность данных (4.2) и Tauri (4.3) — **частично**; логи/метаданные (4.4) — **в основном выполнены**, кроме build-путей; целостность (4.5) — **не готова к релизу** на этом снимке. После исправления M-1…M-3 и release-сборки приложение соответствует ТЗ по безопасности/приватности.

---

## 2. Что уже исправлено во время аудита

| Было (04:33) | Сейчас (04:48) | Оценка |
|---|---|---|
| `csp: null` | production CSP: `default-src 'self'`, `script-src 'self'`, `img-src` без remote, `connect-src` self+IPC, `object-src none`, `frame-ancestors`, `base-uri`, `form-action` (`tauri.conf.json:30`) | ✅ хорошо; добавить `frame-src 'none'; worker-src 'none'` |
| нет `devCsp` | `devCsp` с localhost, ws, `'unsafe-inline'` (`tauri.conf.json:31`) | ✅ dev не сломан; убрать `'unsafe-eval'` |
| `core:default` | минимальные window-права (`capabilities/default.json:8-15`) | ✅ хорошо; добавить `internal-toggle-maximize` |
| `innerHTML` без санитайза | `sanitizeHtml` на load/paste; `sanitizeBackupStore` для workspace (`sanitize.ts`, `NoteEditor.tsx:36,140-145`, `utils.ts:226-268`) | ⚠️ частично (M-1, M-2) |
| persisted state без проверки | `merge` с проверкой nodes/rootIds/tabs + try/catch в `main.tsx:9-13` | ⚠️ остались мелочи (M-3) |
| `tsc`/`dist` | `tsc` 0 ошибок, `dist` пересобран 04:47 | ✅ build проходит |

CSP и capabilities — в рабочем дереве; при коммите проверить, что они попали в итоговый diff.

---

## 3. Находки

### H-1. High (условно, release/integrity). Текущий release-бинарник не содержит фронтенд и указывает на dev-сервер

**Где:** `src-tauri/target/release/nexus` (mtime 04:11), `src-tauri/tauri.conf.json:7-8` (`frontendDist`, `devUrl`).
**Суть:** в бинарнике 0 вхождений строк фронтенда (`Building a Second Brain`, `Knowledge Management`), 1 вхождение `http://localhost:5173`, 212 вхождений `/home/zelly`. Ассеты `dist/` не встроены; при запуске без Vite приложение, вероятнее всего, попытается открыть `devUrl` и не заработает офлайн. Если на порту 5173 окажется локальный процесс, он отдаст webview свой HTML; при текущих window-правах это даёт управление окном (а при возврате широкого `core:default` — ещё path/window/menu-команды). Артефакт, скорее всего, собран не через `pnpm tauri build` (или собран до появления `dist`).
**Рекомендация:**
- Собрать финально: `pnpm build && pnpm tauri build --no-bundle` (или полный bundle), не использовать текущий `target/release/nexus`.
- Проверить без запущенного Vite: остановить `pnpm dev`, запустить бинарник, убедиться, что грузится UI и в DevTools нет запросов к `localhost:5173`.
- Добавить CI-проверку: `strings target/release/nexus | grep -q "Knowledge Management"` и `! strings ... | grep -q "localhost:5173"`.
- Не коммитить/не отдавать `src-tauri/target/**` (уже в `src-tauri/.gitignore`).
- Для метаданных: `[profile.release] strip = true` + `RUSTFLAGS="--remap-path-prefix=$HOME=/build --remap-path-prefix=$PWD=/src"` (см. L-5).

### M-1. Medium. Санитайзер HTML имеет обход и не покрывает drop

**Где:** `src/lib/sanitize.ts:85-109` (walk/unwrap), `:44` (`SAFE_URL`), `:54-83`; `src/components/NoteEditor.tsx:140-145` (`onPaste`), нет `onDrop`; `:103` (`updateNoteContent` raw).
**Суть:** при неизвестном теге (`<foo>`, `<svg>`, `<math>` и т.п.) санитайзер переносит детей в родителя и делает `continue`, **не обходя перенесённые узлы**. Пример: `<foo><img src=x onerror=alert(1)></foo>` — `img` с `onerror` останется. Аналогично `<svg><foreignObject><img onerror=…>`; скрипты/атрибуты внутри неизвестного контейнера не очищаются. `sanitizeBackupStore` использует тот же `sanitizeHtml`, поэтому импорт тоже затронут.
Дополнительно:
- `a[href]` разрешает `data:image/…`, включая `data:image/svg+xml,…`; клик по такой ссылке может навигировать на data-документ (SVG-скрипт), а navigation guard в Tauri нет (L-2).
- `img` разрешает `https:`; CSP сейчас блокирует remote, но санитайзер не должен на это полагаться.
- `onDrop` не перехвачен: drag-and-drop HTML минует `onPaste`-фильтр; `onInput` сохранит сырой HTML, а следующий load его отсанитайзит, но inline-handler может сработать сразу в момент drop (в dev с `'unsafe-inline'` / при ослаблении CSP).
- `settings.utils.ts:123-134` не показывает пользователю, сколько заметок было изменено (`sanitizedNotes` игнорируется).
**Оценка:** в production CSP `script-src 'self'` блокирует inline-обработчики, поэтому готового XSS нет; это Medium как обход defense-in-depth. Если CSP ослабят/сломают — станет High.
**Рекомендация:** перед unwrap вызывать `walk(el)` (санитизировать потомков, пока они ещё внутри), либо после переноса рекурсивно обрабатывать каждый перенесённый узел. Для `a` запретить `data:` полностью; для `img` разрешить только `data:image/(png|jpe?g|webp|gif);base64,`. Добавить `onDrop`/`onDragOver` с `preventDefault` и sanitize. Snippet d1.

### M-2. Medium. Импорт backup: canvas не валидируется, settings.language не проверяется, нет лимита размера

**Где:** `src/settings/utils.ts:226-268` (`sanitizeBackupStore`), `src/settings/sections/Privacy.tsx:111-160` (file input/import/reload).
**Суть:** `sanitizeBackupStore` проверяет только `nexus:store:v1`; `nexus:canvas:v1` записывается как есть. Canvas-объект `image.src` может быть `https://…` или произвольным `data:`; при отсутствии CSP это сетевой запрос, при текущей CSP — блокировка, но данные остаются. `settings.language` из backup не валидируется (`mergeSettings` берёт значение как есть); `useT`/`translate` при `language: "xx"` могут упасть (`DICTS[lang]` undefined) — ErrorBoundary покажет ошибку, но приложение останется в нерабочем состоянии. Нет лимита размера файла (большой JSON → memory/DoS), нет проверки, что импорт заменяет все ключи, и нет сообщения о санитайзе.
**Рекомендация:** валидировать canvas-схему и `image.src` (только `data:image/(png|jpeg|webp|gif);base64,`), проверять `settings.language ∈ {en,ru}`, `theme`, `density`, числа; ограничить файл (например, 25 MB); показывать `sanitizedNotes`/предупреждение; при частичной ошибке не делать reload. Snippet d2.

### M-3. Low/Medium. Persisted state: остались error-callback и «тихая» потеря данных

**Где:** `src/lib/store.ts:1086-1114` (`merge`, `onRehydrateStorage`), `:439-452` (`flushStorage`), `:1160-1162` (`flushPersistence`); `src/main.tsx:9-13`.
**Суть:** `merge` уже проверяет nodes/rootIds/tabs и подставляет `DEFAULT_SETTINGS` — это хорошо. Но:
- `onRehydrateStorage: () => (state) => …` **не принимает `error`**; при corrupt JSON zustand отдаёт initial state, ключ остаётся битым, повторяется каждый запуск.
- `flushStorage` при quota/ошибке очищает `pending` и только `console.warn`; `flushPersistence()` возвращает `void`; Ctrl+S (`shortcutsRuntime.ts:173`) всё равно показывает «Saved». Пользователь может потерять данные, не узнав.
- `main.tsx` try/catch вызывает **тот же** `applySettings`, а не `DEFAULT_SETTINGS`; если ошибка не из-за формы настроек, второй вызов снова упадёт. `settings.language` из backup не валидируется (см. M-2).
**Рекомендация:** `onRehydrateStorage: () => (state, error) => { if (error) { localStorage.removeItem('nexus:store:v1'); return } … }`; `flushStorage(): boolean` + `flushPersistence(): boolean` + toast об ошибке; fallback `applySettings(DEFAULT_SETTINGS)`; валидировать `language`. Snippet d3.

### L-1. Low. Заголовок заметки интерполируется в HTML без экранирования

**Где:** `src/lib/data.ts:286` (`emptyNote`), `src/lib/store.ts:527` (`createNote`).
**Суть:** `${title}` / `${finalName}` попадают в HTML-строку контента. Сейчас UI передаёт статические заголовки, но `createNote(parentId, name)` — публичный action; импорт/будущий UI может дать произвольное имя. Latent-инъекция; CSP смягчает.
**Рекомендация:** `escapeHtml(title)` при формировании контента или рендерить title отдельным узлом. Snippet d1.

### L-2. Low. Внешние ссылки могут увести main webview; нет navigation guard

**Где:** `src/components/MainPane.tsx:143-160` (валидирует `http(s)`/`mailto`, экранирует `"`/`<` — хорошо), `src/components/NoteEditor.tsx:160-175` (перехватывает только `.note-link`, не `a[href]`); в `src-tauri/src/lib.rs` нет `on_navigation`.
**Суть:** вставленная/созданная `<a href="https://…">` при Ctrl+Click/активации может навигировать main webview на внешний сайт; CSP не блокирует top-level navigation. Это фишинг/уход из приложения, не автоматическая отправка данных.
**Рекомендация:** Tauri-плагин с `on_navigation`, разрешающий только `tauri://localhost`/`http://tauri.localhost`, `about:blank` и dev-origin; в редакторе перехватывать все `a[href]`, `preventDefault`, при необходимости спрашивать пользователя. Snippet d4.

### L-3. Low. После минимизации capabilities не добавлен `internal-toggle-maximize`

**Где:** `src-tauri/capabilities/default.json:8-15`; `src-tauri` drag script (`tauri-2.12.7/src/window/scripts/drag.js:103`) вызывает `plugin:window|internal_toggle_maximize` для double-click по `data-tauri-drag-region`.
**Суть:** `core:default` удалён (правильно), но `core:window:allow-internal-toggle-maximize` не добавлен. Перетаскивание (`start-dragging`) и кнопки окна работают; double-click по title bar, вероятно, silently fail. Это функциональная регрессия, не уязвимость.
**Рекомендация:** добавить permission (snippet b) и проверить double-click maximize.

### L-4. Low. UI приватности завышает «actual capabilities»

**Где:** `src/settings/sections/Privacy.tsx:385-415` («Clipboard: Write only», «File system access: No», «This list reflects the actual build capabilities»), `:242` («Document content is never sent over the network»).
**Суть:** приложение действительно не делает сетевых вызовов, CSP блокирует remote-ресурсы; но backup import/export использует файловый picker/download (user-mediated filesystem, не «No»), paste в contentEditable читает буфер (не только write), а формулировка «never sent» держится на CSP/санитайзере. После минимальных capabilities список стал ближе к правде; уточнить формулировки.
**Рекомендация:** «Files: только выбранный пользователем backup-файл», «Clipboard: paste — по действию пользователя, copy — по кнопке», «Network: приложение не инициирует запросы; CSP блокирует remote-ресурсы». Не писать «actual capabilities» как абсолют.

### L-5. Low. Release-бинарник содержит абсолютные build-пути и не stripped

**Где:** `src-tauri/target/release/nexus` (ELF, not stripped; 212 `/home/zelly`), `src-tauri/Cargo.toml` (нет `[profile.release]`).
**Суть:** Rust встраивает пути зависимостей/исходников в panic-location строки; утечка имени пользователя/структуры каталогов при распространении. Не runtime-лог, но метаданные артефакта; усугубляется H-1.
**Рекомендация:** `strip = true` + `--remap-path-prefix` для `$HOME`/workspace; проверить `strings | grep -c "$HOME"` → 0. `panic = "abort"` — только если протестировано.

### L-6. Low. `.gitignore` не закрывает секреты/локальные данные

**Где:** `.gitignore:1-24`; `src-tauri/.gitignore:1-4`; `.env*` отсутствует (проверено `git check-ignore .env` — не игнорируется).
**Суть:** сейчас секретов нет (`.env*` нет, `git grep` по ключам/токенам пуст, один initial commit, unreachable objects нет), но при появлении `.env`, ключей подписи, backup-файлов или локальной БД они могут попасть в коммит.
**Рекомендация:** snippet c. Не игнорировать `screenshots/`, `Cargo.lock`, `pnpm-lock.yaml`.

### L-7. Low. License/version metadata неполные; подделки авторства не найдено

**Где:** `package.json:4` (`version 0.1.0`, нет `license`), `src-tauri/Cargo.toml:5-7` (`authors = ["zelly"]`, `license = ""`, `repository = ""`), `src/settings/sections/About.tsx:14-41`, `README.md:7`.
**Суть:** About перечисляет SPDX-обзор (MIT/ISC/Apache-2.0/OFL), но полных текстов лицензий/`THIRD_PARTY_NOTICES` нет; `Cargo.toml` license пустой, package.json license отсутствует. Версия 0.1.0 синхронизирована в package.json/Tauri/About; поле `license` по-прежнему отсутствует. `authors = ["zelly"]` — локальный username, лучше не публиковать. **Признаков подделки авторства нет**: README честно указывает референс-дизайн, commit author — generic `NEXUS Dev <dev@nexus.local>`.
**Рекомендация:** `LICENSE` (или `"license": "UNLICENSED"` + private), `THIRD_PARTY_NOTICES.md` с текстами Inter OFL, Lucide ISC, React/Tauri MIT/Apache-2.0; синхронизировать версии; убрать персональный `authors` или заменить на проект.

### L-8. Low. Остаточный hardening CSP/devCsp

**Где:** `src-tauri/tauri.conf.json:30-31`.
**Суть:** production CSP не содержит `frame-src 'none'` и `worker-src 'none'` (fallback `default-src 'self'` разрешает same-origin frames/workers). `devCsp` содержит `'unsafe-eval'`, который Vite/React Refresh обычно не требует, и не содержит `frame-src`/`worker-src`/`base-uri`/`form-action` (dev-only). `devtools:false` (`:26`) отключает инспектор и в debug, что мешает проверке CSP.
**Рекомендация:** добавить `frame-src 'none'; worker-src 'none'` в production; убрать `'unsafe-eval'` из `devCsp` (если HMR не требует — проверить); `devtools` держать true для debug через `tauri.dev.conf.json` или убрать. Не ослаблять production `script-src`.

### L-9. Low. Неиспользуемые Rust-зависимости и debug-плагин в release-сборке

**Где:** `src-tauri/Cargo.toml:21-25`.
**Суть:** `serde` и `serde_json` объявлены прямыми зависимостями, но в `src-tauri/src/**` не используются (нет кастомных команд/структур); `tauri-plugin-log` компилируется в release, хотя регистрируется только при `debug_assertions`. Это лишняя supply-chain/compile surface; не уязвимость.
**Рекомендация:** удалить `serde`/`serde_json`, если они не нужны для планируемых команд; вынести `tauri-plugin-log` в optional feature:
```toml
[features]
default = []
dev-log = ["dep:tauri-plugin-log"]
[dependencies]
tauri-plugin-log = { version = "2", optional = true }
```
и гейтить код `#[cfg(feature = "dev-log")]`; `log` оставить, он нужен для `LevelFilter`. Проверить, что release не тянет плагин.

### Info-находки (не уязвимости)

- **I-1. Сеть/телеметрия отсутствует.** В `src/` нет `fetch`, XHR, WebSocket, EventSource, `sendBeacon`, внешних `import`, remote fonts/styles/images. Единственные URL в коде — префикс `https://` для пользовательской ссылки и placeholder `https://…` (`MainPane.tsx:151,336`), они не запрашиваются автоматически. В `pnpm-lock` нет sentry/posthog/analytics/segment/mixpanel/amplitude/bugsnag/datadog/newrelic. В свежем `dist` есть строковые URL из Konva/react-konva (`github.com/konvajs/...`, `konvajs.org/...`) и `react.dev/errors/` — это тексты сообщений/документации, не сетевые запросы.
- **I-2. Идентификаторов нет.** `crypto.randomUUID()` — только локальные id заметок/объектов canvas (`store.ts:195`, `canvas/utils/objects.ts:26`), не пользователь/устройство. Нет `navigator.userAgent`, MAC, серийников, fingerprinting, indexedDB.
- **I-3. Контент не уходит через IPC.** Нет `invoke` кастомных команд, нет `fs`/`shell`/`opener`/`updater`; Rust не видит содержимое заметок. `withGlobalTauri` не включён, asset protocol не включён, release devtools отключены.
- **I-4. CSP — хорошая база.** `default-src 'self'`, `script-src 'self'`, `img-src` без remote, `connect-src` только self+IPC, `object-src none`, `base-uri`, `form-action`, `frame-ancestors`. Tauri сам добавляет nonce/hash для init-скриптов; не включать `dangerousDisableAssetCspModification`.
- **I-5. Логи.** `tauri-plugin-log` только при `cfg!(debug_assertions)` (`src-tauri/src/lib.rs:5-10`); в release плагина нет. В JS только два `console.warn` о невозможности записи localStorage (`store.ts:448`, `canvas/store.ts:121`), без содержимого. Абсолютные пути в runtime-логи не пишутся.
- **I-6. Секретов нет.** `.env*` отсутствует, `git grep` по `API_KEY|SECRET|TOKEN|PASSWORD|BEGIN … KEY` пуст, история — один initial commit, `git fsck --unreachable` пуст. `dist` без source maps. Скриншоты без PNG-текстовых метаданных и без системного UI/PII; контент заметок вымышленный.
- **I-7. Хорошие практики.** Lockfiles tracked; `nodeIntegration`/global Tauri не включены; `decorations:false` компенсировано window-правами; `devUrl` localhost; `https://react.dev/errors/` в бандле — только строка сообщения, не запрос; `src-tauri/target` и `dist` в .gitignore.

---

## 4. Что уже хорошо (кратко)

1. **Приватность by design:** нет сети, телеметрии, аналитики, трекеров, аккаунтов, cloud sync; контент хранится только в WebView localStorage; Rust-сторона не получает документы.
2. **Нет идентификаторов:** UUID — только локальные id.
3. **Минимальная Rust-обвязка:** нет кастомных команд, fs/shell/opener/updater, asset protocol; `withGlobalTauri` false.
4. **CSP настроена** и закрывает remote-origins; `devCsp` не ломает dev; capabilities минимизированы; `devtools:false` для release.
5. **Логи:** debug-only Tauri log, без содержимого; JS-логи только storage errors.
6. **Секреты/история:** чисто; lockfiles; source maps отсутствуют; скриншоты и seed-данные без PII.
7. **Лицензии/авторство:** About перечисляет лицензии, README честно указывает референс; подделки авторства не обнаружено.
8. **Санитайзер уже есть**, store-import валидируется, persisted state мержится с дефолтами — это существенный прогресс относительно baseline.

---

## 5. Соответствие разделу 4 ТЗ

| Блок | Статус | Комментарий |
|---|---|---|
| 4.1 Приватность: сеть/телеметрия/IDs | ✅ в целом | Нет вызовов и пакетов; нет IDs; контент локален. Оговорки: точность UI-текстов (L-4) |
| 4.2 Файлы/данные: XSS, path traversal, localStorage | ⚠️ частично | Нет fs/path traversal (нет fs-плагина). Санитайзер есть, но bypass/drop (M-1); canvas/settings backup (M-2); persisted edge (M-3) |
| 4.3 Tauri: CSP, capabilities, внешние ссылки | ✅/⚠️ | CSP хорошая, capabilities минимальны; нет `internal-toggle-maximize` (L-3), нет navigation guard (L-2), residual `devCsp` (L-8) |
| 4.4 Логи/метаданные/секреты | ✅/⚠️ | Runtime-логи чистые, секретов нет; release-бинарник содержит `/home/zelly` (L-5) и не self-contained (H-1) |
| 4.5 Целостность: deps, dev-артефакты, лицензии | ⚠️ частично | build проходит (04:47), но release-бинарник устарел (H-1); unused Rust deps (L-9), license/gitignore (L-6, L-7) |

---

## 6. Готовые snippets

### (a) CSP: production + devCsp

Текущая production CSP уже хорошая. Финальный вариант (добавлены `frame-src`/`worker-src`, `freezePrototype`):

```json
{
  "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; media-src 'self' data: blob:; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
  "devCsp": "default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:5173 http://127.0.0.1:5173; style-src 'self' 'unsafe-inline' http://localhost:5173 http://127.0.0.1:5173; img-src 'self' data: blob: http://localhost:5173 http://127.0.0.1:5173; font-src 'self' data: http://localhost:5173 http://127.0.0.1:5173; connect-src 'self' ipc: http://ipc.localhost ws://localhost:5173 ws://127.0.0.1:5173 http://localhost:5173 http://127.0.0.1:5173; media-src 'self' data: blob:; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'self'; form-action 'none'",
  "freezePrototype": true,
  "capabilities": ["default"]
}
```

Пояснения:
- `script-src 'self'` в production: Tauri добавляет nonce/hash для своих init-скриптов; Vite-бандл — внешний. Не включать `dangerousDisableAssetCspModification`.
- `style-src 'unsafe-inline'` нужен для inline-style (вы разрешили); это же разрешает CSS-инъекцию — поэтому санитайз обязателен.
- `img-src` без `https:` — remote-картинки из заметок не загрузятся.
- `connect-src` только self+IPC; remote fetch запрещён.
- `devCsp` без `'unsafe-eval'`: Vite HMR обычно не требует eval; если конкретный плагин потребует — добавить точечно и только в dev.
- `freezePrototype` — defense-in-depth; протестировать React/zustand.
- `frame-src 'none'`/`worker-src 'none'` закрывают same-origin iframe/worker, которые иначе разрешает `default-src 'self'`.
- В dev с Vite страницу отдаёт Vite; Tauri-header может не применяться. Для гарантированного dev-CSP добавьте meta-плагин:

```ts
const DEV_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:5173; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:5173; font-src 'self' data: http://localhost:5173; connect-src 'self' ipc: http://ipc.localhost ws://localhost:5173 http://localhost:5173; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none'"
export default defineConfig({
  plugins: [react(), {
    name: 'nexus-dev-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return {
        html,
        tags: [{
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: DEV_CSP },
          injectTo: 'head-prepend',
        }],
      }
    },
  }],
})
```

### (b) Минимальные capabilities + недостающий permission

`src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Main window chrome only",
  "windows": ["main"],
  "permissions": [
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "core:window:allow-unmaximize",
    "core:window:allow-is-maximized",
    "core:window:allow-close",
    "core:window:allow-start-dragging",
    "core:window:allow-internal-toggle-maximize"
  ]
}
```

`internal-toggle-maximize` нужен для double-click по `data-tauri-drag-region`; `start-dragging` — для перетаскивания; остальные — `lib/window.ts`. Больше ничего приложение не вызывает.

### (c) `.gitignore`

Добавить в корневой `.gitignore`:

```gitignore
# secrets / local config
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
*.keystore

# local user data / backups
nexus-backup-*.json
*.sqlite
*.sqlite3
*.db

# test/coverage artifacts
coverage/
test-results/
playwright-report/
```

`src-tauri/target/` и `src-tauri/gen/schemas` уже покрыты `src-tauri/.gitignore`; `dist`/`node_modules`/`*.log` уже есть. `Cargo.lock`/`pnpm-lock.yaml` оставить tracked.

### (d) Код

#### D1. Исправление санитайзера + drop + title

```ts
// src/lib/sanitize.ts — минимальный патч
function walk(node: Node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
      if (['script','style','iframe','object','embed','link','meta','form','input'].includes(tag)) {
        el.remove()
        continue
      }
      if (!ALLOWED_TAGS.has(tag)) {
        // ВАЖНО: сначала очистить потомков, пока они ещё внутри
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

// a: запретить data: полностью; img: только raster data:
function sanitizeUrl(value: string, context: 'a' | 'img'): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (context === 'a' && trimmed.toLowerCase().startsWith('data:')) return null
  if (context === 'img') {
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)) return null
    return trimmed
  }
  return /^(https?:|mailto:|tel:|#|\/)/i.test(trimmed) ? trimmed : null
}
```

В `NoteEditor.tsx` добавить:

```tsx
onDrop={(event) => {
  event.preventDefault()
  const html = event.dataTransfer.getData('text/html')
  if (html) {
    document.execCommand('insertHTML', false, sanitizeHtml(html))
    handleInput()
  } else {
    const text = event.dataTransfer.getData('text/plain')
    if (text) document.execCommand('insertText', false, text)
  }
}}
onDragOver={(event) => event.preventDefault()}
```

Заголовки:

```ts
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]!))
// data.ts emptyNote / store.ts createNote:
`${escapeHtml(title)}` / `${escapeHtml(finalName)}`
```

#### D2. Валидация canvas/settings в backup

```ts
// src/settings/utils.ts — после sanitizeBackupStore
const CANVAS_KEY = 'nexus:canvas:v1'
const MAX_BACKUP_BYTES = 25 * 1024 * 1024

export function sanitizeBackupCanvas(keys: Record<string, string>): Record<string, string> | null {
  const raw = keys[CANVAS_KEY]
  if (!raw) return keys
  try {
    const parsed = JSON.parse(raw) as { state?: { canvases?: Array<{ objects?: Array<{ kind?: string; src?: unknown }> }> } }
    for (const canvas of parsed.state?.canvases ?? []) {
      for (const object of canvas.objects ?? []) {
        if (object.kind !== 'image') continue
        if (typeof object.src !== 'string' ||
            !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(object.src)) {
          return null
        }
      }
    }
    return { ...keys, [CANVAS_KEY]: JSON.stringify(parsed) }
  } catch {
    return null
  }
}
```

В `handleFile`: `if (file.size > MAX_BACKUP_BYTES) { setImportError('Backup too large'); return }`; после `sanitizeBackupStore` вызвать `sanitizeBackupCanvas`; в `mergeSettings` добавить:

```ts
language: patch.language === 'ru' || patch.language === 'en' ? patch.language : base.language,
```

Показывать `sanitizedNotes` (например, toast «N notes were sanitized»).

#### D3. Persisted state / flush

```ts
// store.ts
onRehydrateStorage: () => (state, error) => {
  if (error) {
    console.warn('[nexus] corrupt persisted state, resetting')
    localStorage.removeItem('nexus:store:v1')
    return
  }
  if (!state) return
  // theme/uiScale checks as now
}

function flushStorage(): boolean {
  if (flushTimer) { window.clearTimeout(flushTimer); flushTimer = undefined }
  let ok = true
  for (const [key, value] of pending) {
    try { localStorage.setItem(key, value) } catch (error) { ok = false; console.warn('[nexus] unable to persist state', error) }
  }
  pending.clear()
  return ok
}
export function flushPersistence(): boolean { return flushStorage() }
```

В `shortcutsRuntime.ts` показывать ошибку, если `flushPersistence()` вернул `false`, вместо безусловного «Saved». В `main.tsx` fallback:

```ts
try { applySettings(useStore.getState().settings) }
catch { applySettings(DEFAULT_SETTINGS) }
```

#### D4. Navigation guard (Tauri)

```rust
// src-tauri/src/lib.rs
use tauri::plugin::{Builder as PluginBuilder, TauriPlugin};
use tauri::Runtime;

fn nav_guard<R: Runtime>() -> TauriPlugin<R> {
    PluginBuilder::new("nav-guard")
        .on_navigation(|_webview, url| {
            let local = url.scheme() == "tauri"
                || url.host_str() == Some("tauri.localhost")
                || url.as_str() == "about:blank";
            let dev = cfg!(dev)
                && (url.host_str() == Some("localhost") || url.host_str() == Some("127.0.0.1"))
                && url.port() == Some(5173);
            local || dev
        })
        .build()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(nav_guard())
        // .setup(...) как сейчас
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
```

#### D5. Release-сборка и метаданные

```bash
# финальная сборка (не использовать старый target/release/nexus)
pnpm build
RUSTFLAGS="--remap-path-prefix=$HOME=/build --remap-path-prefix=$PWD=/src" \
  pnpm tauri build --no-bundle

# проверки
strings src-tauri/target/release/nexus | grep -q "Knowledge Management" && echo "assets embedded"
! strings src-tauri/target/release/nexus | grep -q "localhost:5173" && echo "no devUrl"
! strings src-tauri/target/release/nexus | grep -q "$HOME" && echo "no home paths"
```

В `src-tauri/Cargo.toml`:

```toml
[profile.release]
strip = true
```

`strip` не удаляет строковые литералы путей — `--remap-path-prefix` обязателен. `panic = "abort"` — только если протестировано.

---

## 7. Release checklist

1. `pnpm lint && pnpm build` — зелёные (на 04:47 `tsc` 0 ошибок; перепроверить после последних правок).
2. `pnpm tauri build`, запуск **без Vite**, проверка UI/CSP/окна.
3. Проверить CSP в DevTools: нет violations; IPC работает; `devCsp` не блокирует HMR.
4. Проверить окно: minimize/maximize/unmaximize/close, drag, double-click maximize (L-3).
5. Проверить backup export/import под CSP (blob download; если блокируется — добавить только необходимое), crafted JSON, большой файл.
6. Проверить paste/drag HTML, `<foo><img onerror>`, data-ссылки, title с `<`.
7. Проверить `strings` бинарника на `/home/`, `localhost:5173`; `strip`.
8. `.gitignore`/`git status` перед коммитом; не коммитить `dist`, `target`, `.env`, backup.
9. Синхронизировать версии/лицензии; обновить README/About.

---

## 8. Приложение: доказательства

- `tsc -p tsconfig.app.json --noEmit --incremental false` на 04:47: **0 ошибок**; `dist` пересобран 04:47. Но `target/release/nexus` — 04:11 и не содержит фронтенд (H-1).
- `strings target/release/nexus`: `Building a Second Brain` — 0, `Knowledge Management` — 0, `http://localhost:5173` — 1, `/home/zelly` — 212.
- `grep` по `src/`: нет `fetch/XMLHttpRequest/WebSocket/EventSource/sendBeacon`, нет remote `@import/url(`, нет `eval/new Function/dangerouslySetInnerHTML`; `innerHTML` только в `NoteEditor.tsx`; санитайзер используется.
- `pnpm-lock.yaml`: нет sentry/posthog/analytics/segment/mixpanel/amplitude/bugsnag/datadog/newrelic.
- `git`: один initial commit, `git fsck --unreachable` пуст, `git grep` по секретам пуст, `.env*` отсутствует.
- `git check-ignore .env` — не игнорируется (L-6).

*Отчёт подготовлен read-only; рекомендации не применялись. Номера строк — по снимку 04:48; при последующих правках сверяйтесь по именам функций/селекторам.*
