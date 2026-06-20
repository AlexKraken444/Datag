"use client";

// Datag — host-browser controller. Owns:
//   - PeerJS instance with id = roomCode
//   - lobby state (players, chat, ready, team/role selection)
//   - HostMatch lifecycle (start / inputs / events)
// Talks to joiners via per-peer DataConnections; the local host is its own
// "in-process" peer (no network hop for the creator).

import Peer, { type DataConnection } from "peerjs";
import { ICE_CONFIG } from "./ice";
import type {
  ChatMessage,
  LobbyPlayer,
  MatchSummary,
  PlayerInput,
  Role,
  RoomState,
  Team,
} from "@/types/game";
import type { HostToPeer, PeerToHost } from "@/types/messages";
import { HostMatch, type Seat } from "./HostMatch";

const MAX_PLAYERS = 4;

export interface HostCallbacks {
  // mirrors what a joining player would receive — used by host's own UI
  onRoom: (state: RoomState) => void;
  onChat: (msg: ChatMessage) => void;
  onMatchStart: (startsAt: number) => void;
  onSnapshot: (snap: import("@/types/game").GameSnapshot) => void;
  onRoundEnd: (e: {
    scoredBy?: Team;
    bonus?: boolean;
    draw?: boolean;
    score: { A: number; B: number };
  }) => void;
  onMatchEnd: (summary: MatchSummary) => void;
  onError: (msg: string) => void;
}

export class HostController {
  private peer: Peer | null = null;
  private conns = new Map<string, DataConnection>(); // peerId -> conn
  private players = new Map<string, LobbyPlayer>();
  private chat: ChatMessage[] = [];
  private match: HostMatch | null = null;
  private hostPeerId = "";
  private destroyed = false;

  constructor(
    public readonly roomCode: string,
    private cb: HostCallbacks,
  ) {}

  /** Initialize PeerJS peer with id = roomCode (so joiners can dial it directly). */
  async init(
    myNickname: string,
    myUpgrades: string[] = [],
    myCoins = 0,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    return await new Promise((resolve) => {
      let done = false;
      const finish = (r: { ok: true } | { ok: false; error: string }) => {
        if (done) return;
        done = true;
        resolve(r);
      };
      this.peer = new Peer(this.roomCode, {
        debug: 1,
        config: ICE_CONFIG,
      });
      this.peer.on("open", (id) => {
        this.hostPeerId = id;
        this.players.set(id, {
          id,
          nickname: myNickname,
          team: null,
          role: null,
          ready: false,
          connected: true,
          upgrades: [...myUpgrades],
          coins: myCoins | 0,
        });
        this.pushSystem(`${myNickname} создал комнату`);
        this.broadcastRoom();
        finish({ ok: true });
      });
      this.peer.on("connection", (conn) => this.onConnection(conn));
      this.peer.on("error", (e) => {
        const msg = String((e as Error)?.message || e);
        if (msg.includes("ID") && msg.toLowerCase().includes("taken")) {
          finish({ ok: false, error: "Код занят, попробуй ещё раз" });
        } else if (!done) {
          finish({ ok: false, error: msg });
        } else {
          this.cb.onError(msg);
        }
      });
      setTimeout(
        () => finish({ ok: false, error: "PeerJS broker недоступен (таймаут)" }),
        10_000,
      );
    });
  }

  // ---------- lobby actions invoked by the LOCAL host UI ----------

  localSelect(team: Team, role: Role) {
    this.applySelect(this.hostPeerId, team, role);
  }
  localReady(ready: boolean) {
    this.applyReady(this.hostPeerId, ready);
  }
  localChat(text: string) {
    this.applyChat(this.hostPeerId, text);
  }
  localStart() {
    this.tryStartMatch(this.hostPeerId);
  }
  localInput(input: PlayerInput) {
    if (this.match) this.match.input(this.hostPeerId, input);
  }

  hostId() {
    return this.hostPeerId;
  }

  destroy() {
    this.destroyed = true;
    this.match?.stop();
    this.match = null;
    for (const c of this.conns.values()) {
      try { c.close(); } catch {/* ignore */}
    }
    this.conns.clear();
    try { this.peer?.destroy(); } catch {/* ignore */}
    this.peer = null;
  }

  // ---------- connection plumbing ----------

  private onConnection(conn: DataConnection) {
    if (this.players.size >= MAX_PLAYERS) {
      this.send(conn, { t: "kicked", reason: "Комната заполнена" });
      conn.close();
      return;
    }
    if (this.match) {
      // mid-match join only allowed for reconnects (same peer id)
      if (!this.players.has(conn.peer)) {
        this.send(conn, { t: "kicked", reason: "Матч уже идёт" });
        conn.close();
        return;
      }
    }
    this.conns.set(conn.peer, conn);
    conn.on("data", (raw) => {
      const msg = raw as PeerToHost;
      this.handleMessage(conn.peer, msg);
    });
    conn.on("close", () => this.onPeerLeft(conn.peer));
    conn.on("error", () => this.onPeerLeft(conn.peer));
  }

  private handleMessage(peerId: string, msg: PeerToHost) {
    switch (msg.t) {
      case "hello":
        this.applyHello(peerId, msg.nickname, msg.upgrades, msg.coins);
        break;
      case "select":
        this.applySelect(peerId, msg.team, msg.role);
        break;
      case "ready":
        this.applyReady(peerId, msg.ready);
        break;
      case "start":
        this.tryStartMatch(peerId);
        break;
      case "chat":
        this.applyChat(peerId, msg.text);
        break;
      case "input":
        this.match?.input(peerId, msg.payload);
        break;
    }
  }

  // ---------- lobby logic (same as old Room.ts, but local) ----------

  private applyHello(
    peerId: string,
    nickname: string,
    upgrades: string[] = [],
    coins = 0,
  ) {
    // sticky-by-nickname reconnect
    const existing = [...this.players.values()].find(
      (p) => p.nickname === nickname && p.id !== peerId,
    );
    if (existing) {
      this.players.delete(existing.id);
      existing.id = peerId;
      existing.connected = true;
      // refresh upgrades/coins on rejoin (player might have bought new ones)
      existing.upgrades = [...upgrades];
      existing.coins = coins | 0;
      this.players.set(peerId, existing);
    } else if (!this.players.has(peerId)) {
      if (this.players.size >= MAX_PLAYERS) {
        const conn = this.conns.get(peerId);
        if (conn) this.send(conn, { t: "kicked", reason: "Комната заполнена" });
        return;
      }
      this.players.set(peerId, {
        id: peerId,
        nickname,
        team: null,
        role: null,
        ready: false,
        connected: true,
        upgrades: [...upgrades],
        coins: coins | 0,
      });
      this.pushSystem(`${nickname} зашёл в комнату`);
    }
    const me = this.players.get(peerId)!;
    const conn = this.conns.get(peerId);
    if (conn) this.send(conn, { t: "welcome", you: me, host: this.hostPeerId });
    this.broadcastRoom();
    if (this.match) {
      // mid-match rejoin: send latest snapshot
      this.sendTo(peerId, { t: "match_start", startsAt: Date.now() });
      this.sendTo(peerId, { t: "snapshot", snap: this.match.snapshot() });
    }
  }

  private applySelect(peerId: string, team: Team, role: Role) {
    const p = this.players.get(peerId);
    if (!p || this.match) return;
    const taken = [...this.players.values()].some(
      (x) => x.id !== peerId && x.team === team && x.role === role,
    );
    if (taken) return;
    p.team = team;
    p.role = role;
    p.ready = false;
    this.broadcastRoom();
  }

  private applyReady(peerId: string, ready: boolean) {
    const p = this.players.get(peerId);
    if (!p || !p.team || !p.role || this.match) return;
    p.ready = ready;
    this.broadcastRoom();
    if (this.canAutoStart()) this.startMatchInternal();
  }

  private applyChat(peerId: string, text: string) {
    const p = this.players.get(peerId);
    if (!p) return;
    const trimmed = text.trim().slice(0, 240);
    if (!trimmed) return;
    const msg: ChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      from: p.nickname,
      text: trimmed,
      ts: Date.now(),
    };
    this.pushChat(msg);
  }

  private tryStartMatch(peerId: string) {
    if (peerId !== this.hostPeerId) return;
    if (!this.canAutoStart()) return;
    this.startMatchInternal();
  }

  private canAutoStart(): boolean {
    if (this.players.size !== MAX_PLAYERS) return false;
    const ok = (t: Team, r: Role) =>
      [...this.players.values()].some(
        (p) => p.team === t && p.role === r && p.ready,
      );
    return ok("A", "TAGER") && ok("A", "LIGHTER") && ok("B", "TAGER") && ok("B", "LIGHTER");
  }

  private startMatchInternal() {
    if (this.match) return;
    const seats: Seat[] = [];
    for (const p of this.players.values()) {
      if (p.team && p.role)
        seats.push({
          id: p.id,
          team: p.team,
          role: p.role,
          nickname: p.nickname,
          upgrades: [...p.upgrades],
        });
    }
    const startsAt = Date.now() + 1500;
    this.broadcastAll({ t: "match_start", startsAt });
    this.cb.onMatchStart(startsAt);
    this.match = new HostMatch(seats, {
      onSnapshot: (snap) => {
        this.cb.onSnapshot(snap);
        this.broadcastAll({ t: "snapshot", snap });
      },
      onRoundEnd: (e) => {
        this.cb.onRoundEnd(e);
        this.broadcastAll({ t: "round_end", payload: e });
      },
      onMatchEnd: (summary) => {
        this.cb.onMatchEnd(summary);
        this.broadcastAll({ t: "match_end", summary });
        // optional persistence via REST (best-effort)
        try {
          fetch("/api/match-result", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roomCode: this.roomCode, summary }),
          }).catch(() => {/* ignore */});
        } catch {/* ignore */}
        // reset readiness for rematch
        for (const p of this.players.values()) p.ready = false;
        this.match = null;
        this.broadcastRoom();
      },
    });
    this.match.start();
    this.broadcastRoom();
  }

  private onPeerLeft(peerId: string) {
    if (this.destroyed) return;
    const p = this.players.get(peerId);
    if (!p) return;
    this.conns.delete(peerId);
    if (this.match) {
      p.connected = false;
      this.pushSystem(`${p.nickname} отключился`);
      this.broadcastRoom();
    } else {
      this.players.delete(peerId);
      this.pushSystem(`${p.nickname} вышел`);
      this.broadcastRoom();
    }
  }

  // ---------- send helpers ----------

  private state(): RoomState {
    return {
      code: this.roomCode,
      hostId: this.hostPeerId,
      players: [...this.players.values()],
      inMatch: !!this.match,
      chat: this.chat,
    };
  }

  private broadcastRoom() {
    const s = this.state();
    this.cb.onRoom(s);
    this.broadcastAll({ t: "room", state: s });
  }

  private pushChat(msg: ChatMessage) {
    this.chat.push(msg);
    if (this.chat.length > 80) this.chat.shift();
    this.cb.onChat(msg);
    this.broadcastAll({ t: "chat", msg });
  }

  private pushSystem(text: string) {
    this.pushChat({
      id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      from: "system",
      text,
      ts: Date.now(),
      system: true,
    });
  }

  private broadcastAll(msg: HostToPeer) {
    for (const c of this.conns.values()) this.send(c, msg);
  }
  private sendTo(peerId: string, msg: HostToPeer) {
    const c = this.conns.get(peerId);
    if (c) this.send(c, msg);
  }
  private send(c: DataConnection, msg: HostToPeer) {
    try { c.send(msg); } catch {/* ignore broken pipe */}
  }
}
