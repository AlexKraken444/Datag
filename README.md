# Datag — 2v2 Shadow Arena

Соревновательная многопользовательская 2D-игра в формате **2 на 2**: один игрок управляет бойцом (**Tager**), второй — прожектором (**Lighter**), который отбрасывает динамическую тень на арену. Цель — наступить на тень вражеского Tager-а раньше, чем он наступит на твою.

- **Стек:** Next.js 15 (App Router), TypeScript, TailwindCSS, **PixiJS** (рендер), **Socket.IO** (реалтайм), **Zustand** (стейт), **Prisma + PostgreSQL** (история и лидерборд), Framer Motion (UI-анимации).
- **Архитектура:** авторитарный сервер 60Hz, клиент не доверенный, любые попадания решает сервер.

## Запуск

```bash
# 1. зависимости
npm install      # или pnpm / yarn / bun

# 2. конфиг
cp .env.example .env

# 3. (опционально) БД
npx prisma generate
npx prisma db push  # требует Postgres из DATABASE_URL

# 4. запуск (next + socket.io на одном порту)
npm run dev
```

Откройте `http://localhost:3000`. Создайте комнату → отправьте код второму игроку → распределите команды (A/B) и роли (TAGER/LIGHTER) → нажмите «Готов».

> Если PostgreSQL недоступен — игра прекрасно работает, просто без сохранения истории/лидерборда.

## Структура проекта

См. подробности в [`ARCHITECTURE.md`](ARCHITECTURE.md). Кратко:

```
/app          — Next.js App Router (страницы, API)
/components   — UI-компоненты
/game         — клиентский игровой слой (PixiJS, рендер, ввод)
/server       — авторитарный игровой сервер (Socket.IO, систёмы, БД)
/stores       — Zustand-сторы
/hooks        — React-хуки
/lib          — чистая игровая математика (общий код клиент/сервер)
/types        — общие типы
/prisma       — Prisma schema
```

## Скрипты

| команда            | назначение                                        |
| ------------------ | ------------------------------------------------- |
| `npm run dev`      | Next + Socket.IO в одном процессе (порт 3000)     |
| `npm run build`    | сборка Next                                       |
| `npm run start`    | продакшен                                         |
| `npm run db:push`  | синхронизировать схему Prisma с базой             |
| `npm run db:migrate` | dev-миграция                                    |

## Документация

- [`GAME_RULES.md`](GAME_RULES.md) — правила, формулы теней, очки.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — слои, системы, потоки данных.
- [`MULTIPLAYER.md`](MULTIPLAYER.md) — события Socket.IO, мультиплеер, античит.
- [`DEPLOY.md`](DEPLOY.md) — деплой (Docker / Render / Railway / VPS).

## Лицензия

MIT. Развивайте как хотите.
