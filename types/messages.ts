// Datag — typed messages exchanged over PeerJS DataConnection.
// Two directions: PEER ↔ HOST. The host's browser is authoritative.

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

// ---------- peer (joiner) → host ----------

export type PeerToHost =
  | { t: "hello"; nickname: string }
  | { t: "select"; team: Team; role: Role }
  | { t: "ready"; ready: boolean }
  | { t: "start" }                              // ignored unless sender is host
  | { t: "chat"; text: string }
  | { t: "input"; payload: PlayerInput };

// ---------- host → peer (joiner) ----------

export type HostToPeer =
  | { t: "welcome"; you: LobbyPlayer; host: string }
  | { t: "room"; state: RoomState }
  | { t: "chat"; msg: ChatMessage }
  | { t: "match_start"; startsAt: number }
  | { t: "snapshot"; snap: GameSnapshot }
  | { t: "round_end"; payload: {
      scoredBy?: Team;
      bonus?: boolean;
      draw?: boolean;
      score: { A: number; B: number };
    } }
  | { t: "match_end"; summary: MatchSummary }
  | { t: "kicked"; reason: string }
  | { t: "error"; msg: string };
