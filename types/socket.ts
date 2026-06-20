// Datag — strongly-typed Socket.IO contract.

import type {
  ChatMessage,
  GameSnapshot,
  LobbyPlayer,
  MatchSummary,
  PlayerInput,
  Role,
  RoomState,
  Team,
} from "./game";

// --- Client -> Server ---
export interface ClientToServerEvents {
  "room:create": (
    payload: { nickname: string },
    cb: (res: { ok: true; code: string } | { ok: false; error: string }) => void,
  ) => void;

  "room:join": (
    payload: { nickname: string; code: string },
    cb: (res: { ok: true; room: RoomState } | { ok: false; error: string }) => void,
  ) => void;

  "room:leave": () => void;

  "room:select": (payload: { team: Team; role: Role }) => void;
  "room:ready": (payload: { ready: boolean }) => void;
  "room:start": () => void; // host only
  "room:chat": (payload: { text: string }) => void;

  "game:input": (payload: PlayerInput) => void;
  "game:rejoin": () => void;
}

// --- Server -> Client ---
export interface ServerToClientEvents {
  "room:update": (room: RoomState) => void;
  "room:chat": (msg: ChatMessage) => void;
  "room:kicked": (reason: string) => void;
  "room:player_joined": (player: LobbyPlayer) => void;
  "room:player_left": (playerId: string) => void;

  "match:start": (payload: { startsAt: number }) => void;
  "match:snapshot": (snapshot: GameSnapshot) => void;
  "match:round_end": (payload: {
    scoredBy?: Team;
    bonus?: boolean;
    draw?: boolean;
    score: { A: number; B: number };
  }) => void;
  "match:end": (summary: MatchSummary) => void;

  "system:error": (msg: string) => void;
}
