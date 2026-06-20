# Деплой

Datag — это **stateful Node-процесс** (in-memory комнаты + WebSocket). Не подходит для serverless edge без переписывания на отдельный socket-сервер. Хорошо ложится в любое окружение, где есть длинноживущий Node-процесс (Railway, Render, Fly.io, VPS, Docker).

## Переменные окружения

| переменная               | назначение                                       |
| ------------------------ | ------------------------------------------------ |
| `PORT`                   | порт HTTP (по умолчанию 3000)                    |
| `NODE_ENV`               | `production` для prod-сборки                     |
| `DATABASE_URL`           | строка подключения к Postgres (опционально)      |
| `NEXT_PUBLIC_SOCKET_URL` | публичный URL сокет-сервера (как правило, тот же origin) |

## Docker

```dockerfile
# Dockerfile (рекомендуемый)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
```

```bash
docker build -t datag .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." datag
```

## Render / Railway

1. **Build command:** `npm install && npx prisma generate && npm run build`
2. **Start command:** `npm run start`
3. **Health check:** `GET /`
4. **Add-on:** Postgres → подключите как `DATABASE_URL`.
5. **Sticky sessions:** включить (Socket.IO требует, если будет больше одного инстанса).

> Для одного инстанса sticky-sessions не нужны. Масштабирование на N инстансов потребует Redis-адаптер для Socket.IO и вынос комнат из памяти (см. «Масштабирование» ниже).

## VPS

```bash
# на сервере
git clone <repo>; cd datag
npm install
cp .env.example .env  # заполнить DATABASE_URL
npx prisma db push
npm run build
PORT=80 npm run start
# либо через pm2 / systemd
```

Не забудьте **WebSocket-friendly** обратный прокси:

```nginx
server {
  listen 80;
  server_name datag.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }
}
```

## Vercel

Vercel **не подходит** для главного процесса (нет долгоживущих WS-серверов на стандартных функциях). Возможный сценарий: фронт на Vercel, сокет-сервер отдельным сервисом (Railway/Fly). Тогда:

- задеплойте `/server*.ts` и `server.ts` как самостоятельный сервис;
- укажите `NEXT_PUBLIC_SOCKET_URL=https://your-socket-host` на Vercel;
- сервер должен иметь CORS-allowlist для домена Vercel.

## Масштабирование

1. **Redis-адаптер** для Socket.IO (`@socket.io/redis-adapter`) → события расходятся по всем инстансам.
2. **Sticky sessions** на балансировщике (по cookie или IP-hash).
3. **In-memory комнаты → Redis** (хранилище комнат и их состояний).
4. **Game-tick** — оставьте по одному «лидеру» на матч (одна комната = один инстанс), маршрутизация по hash(roomCode).

## База данных

Запустите миграции один раз:

```bash
npx prisma generate
npx prisma migrate deploy   # на проде
# или
npx prisma db push          # быстрый sync
```

Без `DATABASE_URL` сервер работает в режиме «в памяти»: историю/лидерборд писать не будет.
