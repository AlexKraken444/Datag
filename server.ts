// Datag — custom Next.js server hosting Socket.IO on the same HTTP port.
//
// Usage:
//   pnpm dev       (NODE_ENV=development)
//   pnpm start     (NODE_ENV=production after `pnpm build`)

import { createServer } from "node:http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { attachSocketHandlers } from "./server/socket/handlers";
import { RoomManager } from "./server/rooms/RoomManager";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types/socket";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const http = createServer((req, res) => handle(req, res));

  const io = new IOServer<ClientToServerEvents, ServerToClientEvents>(http, {
    path: "/api/socket",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 10_000,
    pingTimeout: 25_000,
  });

  const roomManager = new RoomManager(io);
  attachSocketHandlers(io, roomManager);

  http.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `> Datag ready — http://localhost:${port}  (socket.io @ /api/socket)`,
    );
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal server error:", err);
  process.exit(1);
});
