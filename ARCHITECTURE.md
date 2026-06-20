# Архитектура

## Высокоуровневая схема

```
┌──────────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js Edge/Node)                    │
│                                                                  │
│   Static UI:   /, /create, /join, /room/[code], /game/[code],   │
│                /leaderboard, /history, /settings                 │
│   API:         /api/match-result   (POST) — best-effort save     │
│                /api/leaderboard    (GET)                         │
│                /api/history        (GET)                         │
│                                                                  │
│   Никаких WebSocket-серверов и in-memory комнат на Vercel.       │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS (статика + REST)
                              │
┌──────────────────────────────────────────────────────────────────┐
│                       Браузеры игроков                           │
│                                                                  │
│   HOST (создатель комнаты):                                      │
│      PeerJS peer (id = roomCode)                                 │
│      HostController     — лобби, чат, готовность                 │
│      HostMatch          — 60Hz симуляция (все системы)           │
│      HostLoop           — setInterval(1000/60)                   │
│                                                                  │
│   JOINER:                                                        │
│      PeerJS peer (id = случайный)                                │
│      PeerClient.connect(roomCode)                                │
│      Отправляет input → получает snapshot                        │
│                                                                  │
│   Оба:                                                           │
│      Renderer (PixiJS)  — применяет snapshot к сцене             │
│      InputSystem        — клавиатура+мышь → PlayerInput 30Hz     │
└──────────────────────────────────────────────────────────────────┘
                ▲
                │ WebRTC DataChannel (peer-to-peer)
                │ STUN/TURN: Google + OpenRelay
                │
        ┌───────┴────────┐
        │ PeerJS broker  │  (только handshake; никаких игровых пакетов)
        └────────────────┘
```

## Слои

### `/lib`
Общая математика без сторонних зависимостей.
- `constants.ts` — тайминги, размеры, очки.
- `geometry.ts` — векторы, AABB, point-in-polygon, point-in-triangle.
- `shadow.ts` — `computeShadow()` + `tagerInShadow()`.
- `zones.ts` — стартовые треугольники и Lighter-зоны.
- `code.ts` — генератор кодов комнат, валидация ника.

### `/types`
- `game.ts` — игровые сущности.
- `messages.ts` — типизированные PeerJS-сообщения (`PeerToHost`/`HostToPeer`).

### `/game`
**Симуляция (host):**
- `/game/sim/PlayerSystem.ts` — движение Tager.
- `/game/sim/LightSystem.ts` — Lighter + прицел.
- `/game/sim/ShadowSystem.ts` — полигон тени.
- `/game/sim/CollisionSystem.ts` — point-in-polygon.
- `/game/sim/ScoreSystem.ts` — счёт.
- `/game/sim/RoundSystem.ts` — фазы раунда, респаун.

**Хост-обвязка:**
- `/game/host/HostLoop.ts` — `setInterval` 60Hz / 30Hz.
- `/game/host/HostMatch.ts` — оркестратор систем.
- `/game/host/HostController.ts` — PeerJS-сервер + лобби.
- `/game/host/PeerClient.ts` — клиент для joiner-ов.
- `/game/host/ice.ts` — STUN/TURN-конфиг.

**Рендер:**
- `/game/engine/PixiApp.ts` — PIXI.Application + слои.
- `/game/engine/Renderer.ts` — применяет snapshot.
- `/game/entities/*` — Arena, TagerSprite, LighterSprite, LightCone, ShadowPolygon.
- `/game/systems/InputSystem.ts` — клавиатура+мышь → input 30Hz.

### `/server`
Только то, что нужно Next-роутам:
- `/server/db/prisma.ts` — Prisma client (нулится без `DATABASE_URL`).

### `/stores`
- `useRealtimeStore` — текущая роль (host/peer) и активный controller/client + унифицированный `send`.
- `useRoomStore` — лобби-стейт + чат.
- `useGameStore` — snapshot, итоги, последний `round_end`.
- `useSettingsStore` — тема, громкость.

### `/app`
- Страницы: `/`, `/create`, `/join`, `/room/[code]`, `/game/[code]`, `/leaderboard`, `/history`, `/settings`.
- API: `/api/match-result`, `/api/leaderboard`, `/api/history`.

## Потоки данных

**Создание комнаты:**  
`/create` → `HostController.init` → PeerJS peer открыт → `useRealtimeStore.setHost` → `/room/[code]`.

**Подключение:**  
`/join` → `PeerClient.connect(code)` → DataChannel открыт → `hello` → `welcome` → `useRealtimeStore.setPeer` → `/room/[code]`.

**Старт матча:**  
все 4 готовы → `HostController.startMatchInternal` → broadcast `match_start` → каждый клиент роутится на `/game/[code]`.

**Игровой цикл:**  
host: HostLoop 60Hz → systems → snapshot → broadcast 30Hz через все DataChannel'ы.  
joiner: получает snapshot → `useGameStore.setSnapshot` → подписка GameCanvas → `Renderer.apply`.

**Ввод:**  
`InputSystem` (30Hz) → `useRealtimeStore.input(payload)` → host: `match.input(myId, payload)`, peer: `PeerClient.input(payload)` → datachannel → хост.

**Конец матча:**  
HostMatch.finish → `match_end` всем → host POST'ит в `/api/match-result` (если есть DB).

## SOLID

- **SRP** — каждая система делает одно дело; PeerJS-уровень не знает о геометрии, и наоборот.
- **OCP** — добавить новую механику = добавить файл в `game/sim/`, дёрнуть из `HostMatch.step`.
- **LSP** — `HostLoop` опирается только на `LoopCallbacks` интерфейс.
- **ISP** — `useRealtimeStore` даёт **одинаковый** API в обе стороны (`select`, `ready`, `input`...). Компонент не знает, host он или peer.
- **DIP** — `HostMatch` инжектится через `events`; не зависит ни от PeerJS, ни от React.

## Расширение

| Фича                  | Куда                                       |
| --------------------- | ------------------------------------------ |
| Новая роль            | новая система в `game/sim/`, seat в HostMatch |
| Новая карта           | `lib/zones.ts` + `entities/Arena.ts`       |
| Host-failover         | election-протокол в `HostController` через RPC между всеми пирами (мини-mesh) |
| Воспроизведение матча | сохранять snapshot-поток в `match-result` и читать в `/history/[id]` |
| Спектейторы           | новый тип DataChannel-ветки без `input`-прав |
