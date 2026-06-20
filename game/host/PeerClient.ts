"use client";

// Datag — joiner-side client. Connects to the host's PeerJS peer (id = roomCode),
// sends typed PeerToHost messages, dispatches incoming HostToPeer messages to
// callbacks consumed by the React UI.

import Peer, { type DataConnection } from "peerjs";
import { ICE_CONFIG } from "./ice";
import type {
  ChatMessage,
  GameSnapshot,
  LobbyPlayer,
  MatchSummary,
  PlayerInput,
  Role,
  RoomState,
  Team,
} from "@/types/game";
import type { HostToPeer, PeerToHost } from "@/types/messages";

export interface PeerCallbacks {
  onWelcome: (me: LobbyPlayer, hostId: string) => void;
  onRoom: (state: RoomState) => void;
  onChat: (msg: ChatMessage) => void;
  onMatchStart: (startsAt: number) => void;
  onSnapshot: (snap: GameSnapshot) => void;
  onRoundEnd: (e: {
    scoredBy?: Team;
    bonus?: boolean;
    draw?: boolean;
    score: { A: number; B: number };
  }) => void;
  onMatchEnd: (summary: MatchSummary) => void;
  onKicked: (reason: string) => void;
  onError: (msg: string) => void;
  onConnected: () => void;
  onDisconnected: () => void;
}

export class PeerClient {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private destroyed = false;
  myPeerId = "";

  constructor(
    public readonly roomCode: string,
    public readonly nickname: string,
    private cb: PeerCallbacks,
  ) {}

  /** Connect to host. Resolves once the data channel is open. */
  async connect(): Promise<{ ok: true } | { ok: false; error: string }> {
    return await new Promise((resolve) => {
      this.peer = new Peer({ debug: 1, config: ICE_CONFIG });
      let resolved = false;
      const fail = (error: string) => {
        if (!resolved) {
          resolved = true;
          resolve({ ok: false, error });
        }
      };

      this.peer.on("open", (id) => {
        this.myPeerId = id;
        const c = this.peer!.connect(this.roomCode, { reliable: true });
        this.conn = c;
        c.on("open", () => {
          if (resolved) return;
          resolved = true;
          c.send({ t: "hello", nickname: this.nickname } as PeerToHost);
          this.cb.onConnected();
          resolve({ ok: true });
        });
        c.on("data", (raw) => this.handle(raw as HostToPeer));
        c.on("close", () => {
          this.cb.onDisconnected();
        });
        c.on("error", (e) => {
          fail(String((e as Error)?.message || e));
        });
      });

      this.peer.on("error", (e) => {
        const msg = String((e as Error)?.message || e);
        if (msg.includes("could not connect to peer")) {
          fail("Хост не найден. Проверь код комнаты.");
        } else {
          fail(msg);
        }
      });

      // global timeout
      setTimeout(() => fail("Не удалось подключиться (таймаут)"), 10_000);
    });
  }

  // ----- outbound -----
  select(team: Team, role: Role) { this.send({ t: "select", team, role }); }
  ready(ready: boolean)          { this.send({ t: "ready", ready }); }
  start()                         { this.send({ t: "start" }); }
  chat(text: string)              { this.send({ t: "chat", text }); }
  input(payload: PlayerInput)     { this.send({ t: "input", payload }); }

  destroy() {
    this.destroyed = true;
    try { this.conn?.close(); } catch {/* ignore */}
    try { this.peer?.destroy(); } catch {/* ignore */}
    this.peer = null;
    this.conn = null;
  }

  private send(msg: PeerToHost) {
    if (!this.conn || !this.conn.open) return;
    try { this.conn.send(msg); } catch {/* ignore */}
  }

  private handle(msg: HostToPeer) {
    switch (msg.t) {
      case "welcome":   this.cb.onWelcome(msg.you, msg.host); break;
      case "room":      this.cb.onRoom(msg.state); break;
      case "chat":      this.cb.onChat(msg.msg); break;
      case "match_start": this.cb.onMatchStart(msg.startsAt); break;
      case "snapshot":  this.cb.onSnapshot(msg.snap); break;
      case "round_end": this.cb.onRoundEnd(msg.payload); break;
      case "match_end": this.cb.onMatchEnd(msg.summary); break;
      case "kicked":    this.cb.onKicked(msg.reason); this.destroy(); break;
      case "error":     this.cb.onError(msg.msg); break;
    }
  }
}
