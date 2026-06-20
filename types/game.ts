// Datag — core game types shared between client and server.

export type Team = "A" | "B";
export type Role = "TAGER" | "LIGHTER";
export type Vec2 = { x: number; y: number };

export interface PlayerInput {
  // direction unit vector (Tager) OR -1/0/+1 axis (Lighter)
  moveX: number;
  moveY: number;
  // Tager only
  sprint?: boolean;
  // Lighter only — aim in world coordinates
  aimX?: number;
  aimY?: number;
  brightnessUp?: boolean;
  brightnessDown?: boolean;
  // monotonic per-tick sequence number for reconciliation
  seq: number;
}

export interface TagerState {
  id: string;        // playerId
  team: Team;
  pos: Vec2;
  vel: Vec2;
  stamina: number;
  inStartZone: boolean;
  alive: boolean;
}

export interface LighterState {
  id: string;
  team: Team;
  pos: Vec2;          // constrained to lighter zone
  aim: Vec2;          // world coords the cone points to
  brightness: number; // SHADOW length multiplier
}

export interface ShadowPoly {
  team: Team;         // which team cast it (= same team as Tager)
  // CCW polygon in world space; 4 vertices (quad) is enough for our model
  points: Vec2[];
}

export type RoundPhase = "COUNTDOWN" | "PLAY" | "POST" | "IDLE";

export interface RoundState {
  index: number;
  phase: RoundPhase;
  countdownLeftMs: number;
  elapsedMs: number;
  lastHit?: { team: Team; bonus: boolean; ts: number };
}

export interface ScoreState {
  A: number;
  B: number;
  winner?: Team | "DRAW";
}

export interface GameSnapshot {
  t: number;          // server time (ms)
  tick: number;
  tagers: TagerState[];
  lighters: LighterState[];
  shadows: ShadowPoly[];
  round: RoundState;
  score: ScoreState;
}

export interface LobbyPlayer {
  id: string;         // socket id
  nickname: string;
  team: Team | null;
  role: Role | null;
  ready: boolean;
  connected: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: LobbyPlayer[];
  inMatch: boolean;
  chat: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  from: string;       // nickname
  text: string;
  ts: number;
  system?: boolean;
}

export interface MatchSummary {
  id: string;
  scoreA: number;
  scoreB: number;
  winner: Team | "DRAW";
  finishedAt: number;
  players: { nickname: string; team: Team; role: Role; hits: number }[];
}
