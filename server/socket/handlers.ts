// Datag — Socket.IO wiring. All input is validated server-side; clients never
// claim hits or set positions directly.

import type { Server as IOServer, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket";
import type { RoomManager } from "../rooms/RoomManager";
import { nicknameValid } from "@/lib/code";

type Sock = Socket<ClientToServerEvents, ServerToClientEvents>;

export function attachSocketHandlers(
  io: IOServer<ClientToServerEvents, ServerToClientEvents>,
  rooms: RoomManager,
) {
  io.on("connection", (socket: Sock) => {
    // ----- room lifecycle -----

    socket.on("room:create", ({ nickname }, cb) => {
      if (!nicknameValid(nickname))
        return cb({ ok: false, error: "Некорректный ник" });
      const room = rooms.create(socket.id, nickname);
      cb({ ok: true, code: room.code });
      room.broadcastState();
    });

    socket.on("room:join", ({ nickname, code }, cb) => {
      if (!nicknameValid(nickname))
        return cb({ ok: false, error: "Некорректный ник" });
      const result = rooms.join(socket.id, code, nickname);
      if (!result.ok) return cb({ ok: false, error: result.error });
      cb({ ok: true, room: result.room.state() });
      result.room.broadcastState();
    });

    socket.on("room:leave", () => {
      rooms.leave(socket.id);
    });

    socket.on("room:select", ({ team, role }) => {
      const r = rooms.getBySocket(socket.id);
      r?.select(socket.id, team, role);
    });

    socket.on("room:ready", ({ ready }) => {
      const r = rooms.getBySocket(socket.id);
      r?.setReady(socket.id, !!ready);
    });

    socket.on("room:start", () => {
      const r = rooms.getBySocket(socket.id);
      r?.startManually(socket.id);
    });

    socket.on("room:chat", ({ text }) => {
      if (typeof text !== "string") return;
      const r = rooms.getBySocket(socket.id);
      r?.chat(socket.id, text);
    });

    // ----- gameplay -----

    socket.on("game:input", (payload) => {
      if (!payload || typeof payload !== "object") return;
      const r = rooms.getBySocket(socket.id);
      r?.handleInput(socket.id, payload);
    });

    socket.on("game:rejoin", () => {
      const r = rooms.getBySocket(socket.id);
      r?.rejoinMatch(socket.id);
    });

    // ----- disconnect -----

    socket.on("disconnect", () => {
      rooms.leave(socket.id);
    });
  });
}
