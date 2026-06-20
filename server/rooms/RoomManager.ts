// Datag — keeps the in-memory registry of active rooms and routes a socket
// to the room it currently belongs to.

import type { Server as IOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket";
import { Room } from "./Room";
import { generateRoomCode } from "@/lib/code";

export class RoomManager {
  private rooms = new Map<string, Room>();
  /** socketId -> roomCode */
  private socketIndex = new Map<string, string>();

  constructor(
    private io: IOServer<ClientToServerEvents, ServerToClientEvents>,
  ) {}

  create(hostId: string, nickname: string): Room {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();
    const room = new Room(this.io, code, hostId, () => this.destroy(code));
    room.addPlayer(hostId, nickname);
    this.rooms.set(code, room);
    this.socketIndex.set(hostId, code);
    return room;
  }

  join(socketId: string, code: string, nickname: string):
    | { ok: true; room: Room }
    | { ok: false; error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { ok: false, error: "Комната не найдена" };
    if (room.isFull() && !room.hasNickname(nickname))
      return { ok: false, error: "Комната заполнена" };
    if (room.inMatch && !room.hasNickname(nickname))
      return { ok: false, error: "Матч уже идёт" };

    const result = room.addPlayer(socketId, nickname);
    if (!result.ok) return { ok: false, error: result.error };
    this.socketIndex.set(socketId, room.code);
    return { ok: true, room };
  }

  leave(socketId: string): void {
    const code = this.socketIndex.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) {
      this.socketIndex.delete(socketId);
      return;
    }
    room.removePlayer(socketId);
    this.socketIndex.delete(socketId);
    if (room.isEmpty()) this.destroy(code);
  }

  getBySocket(socketId: string): Room | undefined {
    const code = this.socketIndex.get(socketId);
    return code ? this.rooms.get(code) : undefined;
  }

  private destroy(code: string) {
    const room = this.rooms.get(code);
    if (room) room.dispose();
    this.rooms.delete(code);
  }
}
