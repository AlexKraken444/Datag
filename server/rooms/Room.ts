// Datag — single room: lobby state, chat, role assignment, match lifecycle.

import type { Server as IOServer, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket";
import type {
  ChatMessage,
  LobbyPlayer,
  PlayerInput,
  Role,
  RoomState,
  Team,
} from "@/types/game";
import { Match } from "../game/Match";

const MAX_PLAYERS = 4;

export class Room {
  private players = new Map<string, LobbyPlayer>();
  private chat: ChatMessage[] = [];
  private match: Match | null = null;

  constructor(
    private io: IOServer<ClientToServerEvents, ServerToClientEvents>,
    public readonly code: string,
    public hostId: string,
    private onDestroy: () => void,
  ) {}

  // ---------- player roster ----------

  addPlayer(socketId: string, nickname: string):
    | { ok: true }
    | { ok: false; error: string } {
    // reconnection by nickname (sticky session)
    const existing = [...this.players.values()].find(
      (p) => p.nickname === nickname,
    );
    if (existing) {
      this.players.delete(existing.id);
      existing.id = socketId;
      existing.connected = true;
      this.players.set(socketId, existing);
      this.io.sockets.sockets.get(socketId)?.join(this.code);
      this.broadcastState();
      return { ok: true };
    }

    if (this.players.size >= MAX_PLAYERS)
      return { ok: false, error: "Комната заполнена" };

    const player: LobbyPlayer = {
      id: socketId,
      nickname,
      team: null,
      role: null,
      ready: false,
      connected: true,
    };
    this.players.set(socketId, player);
    this.io.sockets.sockets.get(socketId)?.join(this.code);
    this.pushSystemChat(`${nickname} зашёл в комнату`);
    this.broadcastState();
    return { ok: true };
  }

  removePlayer(socketId: string) {
    const p = this.players.get(socketId);
    if (!p) return;
    // during match: keep slot, mark disconnected (allows rejoin)
    if (this.match) {
      p.connected = false;
      this.pushSystemChat(`${p.nickname} отключился`);
      this.broadcastState();
      return;
    }
    this.players.delete(socketId);
    this.pushSystemChat(`${p.nickname} вышел`);
    if (socketId === this.hostId) {
      const next = this.players.values().next().value;
      if (next) this.hostId = next.id;
    }
    this.broadcastState();
  }

  // ---------- lobby actions ----------

  select(socketId: string, team: Team, role: Role) {
    const p = this.players.get(socketId);
    if (!p || this.match) return;

    // disallow if slot already taken
    const taken = [...this.players.values()].some(
      (x) => x.id !== p.id && x.team === team && x.role === role,
    );
    if (taken) return;

    p.team = team;
    p.role = role;
    p.ready = false;
    this.broadcastState();
  }

  setReady(socketId: string, ready: boolean) {
    const p = this.players.get(socketId);
    if (!p || !p.team || !p.role || this.match) return;
    p.ready = ready;
    this.broadcastState();

    if (this.canAutoStart()) this.startMatch();
  }

  startManually(socketId: string) {
    if (socketId !== this.hostId) return;
    if (!this.canAutoStart()) return;
    this.startMatch();
  }

  chat(socketId: string, text: string) {
    const p = this.players.get(socketId);
    if (!p) return;
    const trimmed = text.trim().slice(0, 240);
    if (!trimmed) return;
    const msg: ChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      from: p.nickname,
      text: trimmed,
      ts: Date.now(),
    };
    this.chat.push(msg);
    if (this.chat.length > 80) this.chat.shift();
    this.io.to(this.code).emit("room:chat", msg);
  }

  // ---------- match ----------

  get inMatch() {
    return !!this.match;
  }

  private canAutoStart(): boolean {
    if (this.players.size !== MAX_PLAYERS) return false;
    const ok = (t: Team, r: Role) =>
      [...this.players.values()].some(
        (p) => p.team === t && p.role === r && p.ready,
      );
    return ok("A", "TAGER") && ok("A", "LIGHTER") && ok("B", "TAGER") && ok("B", "LIGHTER");
  }

  private startMatch() {
    if (this.match) return;
    const seats: { id: string; team: Team; role: Role; nickname: string }[] =
      [];
    for (const p of this.players.values()) {
      if (p.team && p.role)
        seats.push({ id: p.id, team: p.team, role: p.role, nickname: p.nickname });
    }
    this.match = new Match(
      this.io,
      this.code,
      seats,
      (summary) => {
        // match ended -> reset readiness, clear match
        for (const p of this.players.values()) p.ready = false;
        this.match = null;
        this.io.to(this.code).emit("match:end", summary);
        this.broadcastState();
      },
    );
    this.io
      .to(this.code)
      .emit("match:start", { startsAt: Date.now() + 1500 });
    this.match.start();
    this.broadcastState();
  }

  handleInput(socketId: string, input: PlayerInput) {
    if (!this.match) return;
    this.match.input(socketId, input);
  }

  rejoinMatch(socketId: string) {
    if (!this.match) return;
    this.match.rejoin(socketId);
  }

  // ---------- helpers ----------

  isEmpty() {
    return this.players.size === 0;
  }
  isFull() {
    return this.players.size >= MAX_PLAYERS;
  }
  hasNickname(n: string) {
    return [...this.players.values()].some((p) => p.nickname === n);
  }

  state(): RoomState {
    return {
      code: this.code,
      hostId: this.hostId,
      players: [...this.players.values()],
      inMatch: this.inMatch,
      chat: this.chat,
    };
  }

  broadcastState() {
    this.io.to(this.code).emit("room:update", this.state());
  }

  private pushSystemChat(text: string) {
    const msg: ChatMessage = {
      id: `sys_${Date.now()}`,
      from: "system",
      text,
      ts: Date.now(),
      system: true,
    };
    this.chat.push(msg);
    this.io.to(this.code).emit("room:chat", msg);
  }

  dispose() {
    this.match?.stop();
    this.match = null;
    this.players.clear();
    this.onDestroy?.();
  }
}
