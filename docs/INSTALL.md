# Установка NEXUS

NEXUS — локальное десктоп-приложение (Tauri 2). Данные хранятся только на вашем
компьютере в localStorage WebView; сеть приложению не нужна.

Ниже — три способа: готовый бинарник, сборка из исходников и сборка установочного
пакета/AppImage.

---

## Вариант 1. Готовый бинарник (самый быстрый)

Требуется Linux x86_64 и системные библиотеки WebKitGTK (см. «Зависимости»).

```bash
# скачать из GitHub Releases (подставьте актуальную версию)
curl -L -o nexus.tar.gz https://github.com/<USER>/nexus/releases/download/v0.1.0/nexus-0.1.0-linux-x86_64.tar.gz

tar -xzf nexus.tar.gz
chmod +x nexus
./nexus
```

Можно положить исполняемый файл в `~/.local/bin` и создать ярлык:

```bash
install -Dm755 nexus ~/.local/bin/nexus
```

Создайте `~/.local/share/applications/nexus.desktop`:

```ini
[Desktop Entry]
Name=NEXUS
Comment=Personal knowledge workspace
Exec=%h/.local/bin/nexus
Icon=nexus
Type=Application
Categories=Office;TextEditor;
StartupWMClass=nexus
```

> Приложение не подписывается и не публикуется в дистрибутивных репозиториях;
> запускайте только свою сборку или сборку из этого репозитория.

---

## Вариант 2. Сборка из исходников

### Зависимости

**Arch / CachyOS / Manjaro:**

```bash
sudo pacman -S --needed base-devel rust nodejs pnpm \
  webkit2gtk-4.1 gtk3 libsoup3 librsvg \
  xdotool libayatana-appindicator
```

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev \
  libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# Node.js 20+ и pnpm: https://nodejs.org, https://pnpm.io/installation
```

**Fedora:**

```bash
sudo dnf install -y gcc gcc-c++ make curl wget file openssl-devel \
  gtk3-devel webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### Сборка и запуск

```bash
git clone https://github.com/<USER>/nexus.git
cd nexus
pnpm install

# разработка: Vite + Tauri, окно 1440×900
pnpm tauri dev

# релизный бинарник: src-tauri/target/release/nexus
pnpm tauri build --no-bundle

# установочные пакеты (AppImage/DEB/RPM — зависит от ОС)
pnpm tauri build
```

Готовый бинарник: `src-tauri/target/release/nexus` (~7 МБ).

---

## Где хранятся данные

- Заметки, настройки, вкладки и Canvas — в `localStorage` WebView.
  Каталог профиля Tauri: `~/.local/share/com.nexus.app/` (Linux).
- Резервная копия: **Настройки → Privacy & Security → Export backup** (JSON).
  Импорт восстанавливает workspace/настройки/Canvas с валидацией и санитайзом.
- Полный сброс: удалить каталог профиля (закройте приложение перед удалением).

## Обновление

- Из исходников: `git pull && pnpm install && pnpm tauri build --no-bundle`.
- Из релиза: заменить исполняемый файл, профиль и данные сохранятся.
- Настройки и данные совместимы между версиями 0.1.x (есть миграции persisted-state).

## Удаление

1. Удалите исполняемый файл и `.desktop` (если создавали).
2. Опционально удалите каталог профиля `~/.local/share/com.nexus.app/`.
3. Данные в браузерном preview-режиме хранятся в localStorage браузера.

## Разработка

```bash
pnpm dev                 # только фронтенд (браузер)
pnpm build               # tsc strict + production build
pnpm tauri dev           # настольное приложение
```

Тесты UI выполнялись Playwright на frozen production-сборке; см. `docs/test-results.txt`.
Стек: Tauri 2.12, React 19, TypeScript, Tailwind CSS 3.4, zustand, Konva/react-konva,
Lucide, Inter Variable.

## Возможные проблемы

| Симптом | Причина / решение |
| --- | --- |
| Окно не появляется | Не установлен WebKitGTK 4.1 или GTK 3 — установите зависимости |
| `pnpm tauri build` падает на bundling | Нужны `librsvg`, `patchelf`, `file`; либо используйте `--no-bundle` |
| Пустое окно | Повреждён persisted-state: удалите `~/.local/share/com.nexus.app/` (данные потеряются) — в приложении есть fallback |
| Не сохраняются большие Canvas | localStorage ограничен (~5 МБ); уменьшите изображения, сделайте бэкап |
| Нет звука/уведомлений | Приложение не использует системные уведомления; тосты показываются в окне |
