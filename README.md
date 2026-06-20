# Datag — 2v2 Shadow Arena

Соревновательная 2D-игра 2 на 2. Один игрок управляет бойцом (**Tager**), второй — прожектором (**Lighter**), который отбрасывает динамическую тень. Цель — наступить на тень вражеского Tager-а первым.

- **Стек:** Next.js 15 (App Router), TypeScript, TailwindCSS, **PixiJS** (рендер), **PeerJS / WebRTC** (p2p-реалтайм), **Zustand** (стейт), **Prisma + PostgreSQL** (история, опционально), Framer Motion.
- **Архитектура:** host-authoritative. Браузер игрока, создавшего комнату, запускает симуляцию 60Hz и рассылает снапшоты остальным трём напрямую через WebRTC datachannel'ы.
- **Деплой:** работает на **Vercel** без внешних серверов. PeerJS public broker используется только для рукопожатия WebRTC.

## Запуск локально

```bash
npm install
cp .env.example .env
npm run dev       # http://localhost:3000
```

База опциональна. Если хочешь лидерборд/историю:
```bash
# поднимаешь любой Postgres, указываешь DATABASE_URL в .env
npx prisma db push
```

## Деплой на Vercel

1. Импортируй репозиторий в Vercel.
2. (опционально) добавь Vercel Postgres / Neon / Supabase и переменную `DATABASE_URL`.
3. Деплой запускается автоматически. Никаких WebSocket-серверов поднимать не нужно — игра работает p2p.

Подробнее: [`DEPLOY.md`](DEPLOY.md).

## Структура проекта

См. [`ARCHITECTURE.md`](ARCHITECTURE.md).

```
/app             — страницы и API роуты
/components      — UI
/game/engine     — PixiJS-рендер
/game/entities   — Pixi-обёртки сущностей
/game/sim        — игровая симуляция (запускается у хоста в браузере)
/game/host       — HostController, PeerClient, HostMatch, ICE-конфиг
/game/systems    — InputSystem (сбор клавиш/мыши)
/lib             — общая математика и константы
/server/db       — Prisma (используется только API-роутами)
/stores          — Zustand
/types           — общие типы
/prisma          — schema
```

## Документация

- [`GAME_RULES.md`](GAME_RULES.md) — правила, формулы теней, очки.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — слои, системы, потоки данных.
- [`MULTIPLAYER.md`](MULTIPLAYER.md) — PeerJS-протокол, безопасность.
- [`DEPLOY.md`](DEPLOY.md) — Vercel и альтернативы.

## Лицензия

MIT.
