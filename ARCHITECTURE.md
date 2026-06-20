# Архитектура

## Высокоуровневая схема

```
┌──────────────────────────────────────────────────────────────────┐
│                        Браузер (клиент)                          │
│                                                                  │
│   Next.js App Router  ─►  React + Tailwind + Framer Motion       │
│   Zustand-сторы       ─►  socket, room, game, settings           │
│   Хуки                ─►  useKeyboard, useMouse, useFullscreen   │
│   PixiJS-рендер       ─►  Arena, TagerSprite, LighterSprite,     │
│                            LightCone, ShadowPolygon              │
│   InputSystem         ─►  собирает ввод и шлёт 30Hz пакеты       │
└──────────────────────────────────────────────────────────────────┘
                           ▲ snapshot (30Hz)   │ input (30Hz)
                           │ events            ▼
┌──────────────────────────────────────────────────────────────────┐
│                          Сервер (Node)                           │
│                                                                  │
│   custom Next server + Socket.IO (один процесс, один порт)       │
│   RoomManager → Room → Match                                     │
│                                                                  │
│   Match -> GameLoop 60Hz                                         │
│            ├─ PlayerSystem    (движение Tager)                   │
│            ├─ LightSystem     (движение/прицел Lighter)          │
│            ├─ ShadowSystem    (полигон тени)                     │
│            ├─ CollisionSystem (point-in-polygon)                 │
│            ├─ ScoreSystem     (очки, победитель)                 │
│            └─ RoundSystem     (фазы COUNTDOWN/PLAY/POST/IDLE)    │
│                                                                  │
│   Prisma -> PostgreSQL (Match, MatchPlayer, Leaderboard)         │
└──────────────────────────────────────────────────────────────────┘
```

## Слои

### `/lib` — общая чистая математика
Используется и сервером, и клиентом без сторонних зависимостей.
- `constants.ts` — все игровые числа (один источник истины).
- `geometry.ts` — векторы, AABB, point-in-polygon, point-in-triangle.
- `shadow.ts` — `computeShadow()` + `tagerInShadow()`.
- `zones.ts` — стартовые треугольники Tager-ов и прямоугольники Lighter-ов.
- `code.ts` — генератор кодов комнат и валидация ника.

### `/types`
- `game.ts` — игровые сущности (Tager, Lighter, Shadow, RoundState…).
- `socket.ts` — строго типизированный контракт Socket.IO.

### `/server` (Node, авторитарный)
- `server.ts` — bootstrap Next + Socket.IO.
- `socket/handlers.ts` — подписка на события и маршрутизация в Room.
- `rooms/RoomManager.ts` — реестр комнат, поиск по сокету.
- `rooms/Room.ts` — лобби-стейт, чат, готовность, ре-коннект по нику.
- `game/Match.ts` — оркестрация матча.
- `game/GameLoop.ts` — `setInterval(1000/60)` для симуляции + `1000/30` для broadcast.
- `game/systems/*` — изолированные «системы» (SOLID/SRP).
- `db/prisma.ts` — единый клиент Prisma (опционально для dev).

### `/game` (клиентский игровой слой)
- `engine/PixiApp.ts` — PIXI.Application + слои (bg / shadows / light / entities / hud).
- `engine/Renderer.ts` — применяет серверные snapshot к сцене.
- `entities/*` — Pixi-обёртки сущностей.
- `systems/InputSystem.ts` — собирает клавиатуру + мышь, шлёт `PlayerInput` 30 раз/сек.

### `/components`
Только React UI. Никакой игровой логики.

### `/stores`
- `useSocketStore` — singleton-клиент.
- `useRoomStore` — лобби-стейт + чат.
- `useGameStore` — последний snapshot и summary матча.
- `useSettingsStore` — тема, громкость, fullscreen.

### `/app`
Страницы App Router: `/`, `/create`, `/join`, `/room/[code]`, `/game/[code]`, `/leaderboard`, `/history`, `/settings`.  
API-роуты: `/api/leaderboard`, `/api/history`.

## SOLID-разбор

- **SRP** — каждая «система» (Player, Light, Shadow, Collision, Score, Round) делает одно дело и не знает о соседях.
- **OCP** — добавление новой механики (например, новой роли) ⇒ добавляем систему; существующие не правим.
- **LSP** — `Match` подписывается на абстрактный интерфейс `LoopCallbacks`; цикл можно подменить (например, на детерминированный для тестов).
- **ISP** — типы событий Socket разделены на `ClientToServerEvents` / `ServerToClientEvents`; ничего лишнего.
- **DIP** — `Match` зависит от **типа** `IOServer`, а не от конкретной реализации транспорта; БД через `prisma` опциональна.

## Производительность

- Snapshot ~10 чисел × 6 сущностей ≈ <1 KB JSON, 30 раз/сек = ~30 KB/s per игрок. Дёшево.
- PIXI рисует только 4 шейп-объекта (полигоны тени) + 4 спрайта + 2 конуса. На ноутбуке стабильные 144 fps.
- Чистые функции в `/lib` тривиально юнит-тестируются.

## Расширение

Куда смотреть, если захотите добавить:

| Фича                | Куда                                                      |
| ------------------- | --------------------------------------------------------- |
| Новые карты         | `lib/zones.ts` + `entities/Arena.ts`                      |
| Прокачка / абилки   | новая система в `server/game/systems/`                    |
| Голосовой чат       | новый сервис рядом с `server/socket/`                     |
| Зрители (spectate)  | extra socket room + read-only snapshot                    |
| Турниры             | новый таблицы Prisma + cron над `Match`                    |
