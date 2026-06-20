# Деплой

Datak — **fully serverless**. Никаких long-running процессов, никаких WebSocket-серверов. Игра работает peer-to-peer через WebRTC; Vercel хостит только статику + REST для лидерборда/истории.

## Vercel

1. Зайди на vercel.com → **Add New → Project** → импортируй `AlexKraken444/Datak`.
2. Vercel сам определит Next.js. Никаких ручных команд указывать не нужно — `vercel.json` уже есть в репо.
3. **(опционально) База:** в Vercel Storage → Create Postgres (или Neon) → подключи к проекту, получишь `DATABASE_URL` автоматически.
4. Если БД добавил — однократно прогони миграцию: локально с твоим `DATABASE_URL` выполни `npx prisma db push`.
5. **Deploy**. Готово — после билда сайт работает.

Без `DATABASE_URL`:
- Игра играется полностью.
- Лидерборд/история показывают «пусто».
- `/api/match-result` возвращает `{ ok: true, persisted: false }`.

## Переменные окружения

| Переменная     | Назначение                                      | Обязательная? |
| -------------- | ----------------------------------------------- | ------------- |
| `DATABASE_URL` | Postgres для лидерборда и истории матчей        | нет           |

## Локальный запуск

```bash
npm install
cp .env.example .env
npm run dev       # http://localhost:3000
```

Открой два окна (или два устройства в одной сети / двух разных) → в одном «Создать», во втором «Войти по коду» → готово.

## Сетевые требования

WebRTC требует HTTPS в продакшене. Vercel выдаёт HTTPS автоматически. Локально `http://localhost` тоже работает (браузеры считают localhost безопасным контекстом).

**Если игроки не могут соединиться** (за корпоративным/CGNAT-NAT):
- Datak использует публичный TURN-фоллбэк `openrelay.metered.ca` — должен покрывать большинство случаев.
- При желании замени `game/host/ice.ts` на свой TURN (Twilio, Cloudflare TURN, Coturn на собственном VPS).

## Альтернативные хостинги

Поскольку всё статическое + serverless, подойдёт любой:
- **Netlify** — добавь `@netlify/plugin-nextjs`.
- **Cloudflare Pages** — Next 15 поддерживается через `@cloudflare/next-on-pages`.
- **AWS Amplify** — авто-детект Next.js.
- **Railway / Render** — тоже работают, но смысла нет (переплата за idle).

## Своя БД

Подойдёт любой Postgres:
- **Neon** (рекомендую, бесплатный tier, serverless-friendly).
- **Supabase**.
- **Vercel Postgres**.
- **Railway / Render Postgres**.

После подключения:
```bash
# на машине с доступом к этой БД
DATABASE_URL="postgresql://..." npx prisma db push
```
