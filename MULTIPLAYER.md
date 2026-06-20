# Мультиплеер и античит

## Транспорт

- **Socket.IO** поверх HTTP/WebSocket, путь `/api/socket`.
- Сервер и Next.js работают **в одном процессе** на одном порту — кастомный `server.ts`.
- Транспорты: `["websocket", "polling"]` (websocket предпочтителен).

## Контракт событий

Полная типизация — `types/socket.ts`. Кратко:

### Клиент → Сервер

| Событие         | Аргументы                                 | Ответ (ack)                      |
| --------------- | ----------------------------------------- | -------------------------------- |
| `room:create`   | `{ nickname }`                            | `{ ok, code? , error? }`         |
| `room:join`     | `{ nickname, code }`                      | `{ ok, room? , error? }`         |
| `room:leave`    | —                                         | —                                |
| `room:select`   | `{ team, role }`                          | —                                |
| `room:ready`    | `{ ready }`                               | —                                |
| `room:start`    | — *(только хост, если все готовы)*        | —                                |
| `room:chat`     | `{ text }`                                | —                                |
| `game:input`    | `PlayerInput`                             | —                                |
| `game:rejoin`   | —                                         | сервер дошлёт snapshot           |

### Сервер → Клиент

| Событие              | Payload                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `room:update`        | `RoomState` (полная картина лобби)                                      |
| `room:chat`          | `ChatMessage`                                                           |
| `match:start`        | `{ startsAt: number }`                                                  |
| `match:snapshot`     | `GameSnapshot` (≈30Hz)                                                  |
| `match:round_end`    | `{ scoredBy?, bonus?, draw?, score: { A, B } }`                         |
| `match:end`          | `MatchSummary`                                                          |
| `system:error`       | строка                                                                  |

## Жизненный цикл

```
[создание]  client ── room:create ──► RoomManager.create
                                       └─ Room (host) → room:update

[join]     client ── room:join ──► RoomManager.join → Room.addPlayer
                                                    └─ room:update

[лобби]    выбор команды/роли (room:select), чат (room:chat),
            готовность (room:ready). Авто-старт когда все 4 готовы.

[матч]     Room → new Match → GameLoop 60Hz
            ├─ принимаем game:input на каждом тике
            ├─ симулируем PlayerSystem/LightSystem/...
            ├─ рассчитываем Shadow + Collision
            ├─ начисляем Score; на хите/ничье отправляем match:round_end
            └─ когда A или B достигла 12 → match:end (+ запись в Postgres)
```

## Переподключение

- При `disconnect` во время матча игрок помечается как `connected=false`,
  слот **остаётся** за его ником.
- При следующем `room:join` с тем же ником сервер реассигнит сокет на старый слот
  (см. `Room.addPlayer`) — никаких очков игрок не теряет.
- Клиент шлёт `game:rejoin`, чтобы немедленно получить актуальный snapshot.

## Античит — почему серверу можно доверять

| Что проверяет сервер                                | Где                                |
| ---------------------------------------------------- | ---------------------------------- |
| Movement input clamp (−1..1, нормализация)           | `PlayerSystem`                     |
| Принадлежность Lighter своей зоне (AABB clamp)       | `LightSystem` + `LighterZones`     |
| Граница арены / стены                                | `PlayerSystem` (clamp по координатам) |
| Длина и геометрия тени                               | `ShadowSystem` + `lib/shadow`      |
| Попадание в тень                                     | `CollisionSystem` (point-in-polygon) |
| Стартовая зона жертвы → бонус 2 очка                 | `CollisionSystem` (флаг tager.inStartZone) |
| Окно ничьей ≤ 100 мс                                 | `Match.step` (две одновременные коллизии на тике) |
| Поедание спринта по стамине                          | `PlayerSystem`                     |
| Готовность / роль / команда                          | `Room.select`, `Room.setReady`     |

Клиент **не имеет права**:
- сообщать «я попал»,
- задавать собственную позицию,
- менять очки,
- стартовать матч без хоста и не полным составом.

Серверный snapshot — **единственный источник истины**. Клиент его рисует, без локальной симуляции/предсказания (это можно добавить позже отдельной фичей).

## Производительность сети

- 30Hz × ~600 байт snapshot ≈ 18 KB/sec на игрока.
- Input — 30Hz × ~80 байт ≈ 2 KB/sec.
- Без сжатия и дельт игра укладывается в нормальные 100ms RTT.

## Безопасность входа

- Никнейм валидируется регуляркой `^[\p{L}\p{N}_-]{2,16}$`.
- Чат: до 240 символов, обрезается trim+slice, лимит хранится в памяти (последние 80 сообщений).
- Никаких токенов/сессий пока нет — лидерборд работает «по нику». Авторизацию (NextAuth) можно добавить позже без поломок: User уже есть в Prisma-схеме.
