"use client";

// Datak — singleton wrapper around the active realtime endpoint.
// In a host browser:   role = "host",  ctl is HostController
// In a peer browser:   role = "peer",  ctl is PeerClient
// Provides one unified send-API used by UI components.

import { create } from "zustand";
import type {
  GameSnapshot,
  MatchSummary,
  PlayerInput,
  Role,
  Team,
} from "@/types/game";
import type { HostController } from "@/game/host/HostController";
import type { PeerClient } from "@/game/host/PeerClient";

interface RealtimeStore {
  role: "host" | "peer" | null;
  host: HostController | null;
  peer: PeerClient | null;
  myPeerId: string;
  setHost: (h: HostController) => void;
  setPeer: (p: PeerClient) => void;
  reset: () => void;
  // Unified outbound commands. They become no-ops if no connection is set up.
  select: (team: Team, role: Role) => void;
  ready: (ready: boolean) => void;
  start: () => void;
  chat: (text: string) => void;
  input: (payload: PlayerInput) => void;
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  role: null,
  host: null,
  peer: null,
  myPeerId: "",
  setHost: (h) => set({ role: "host", host: h, peer: null, myPeerId: h.hostId() }),
  setPeer: (p) => set({ role: "peer", peer: p, host: null, myPeerId: p.myPeerId }),
  reset: () => {
    const { host, peer } = get();
    try { host?.destroy(); } catch {/* ignore */}
    try { peer?.destroy(); } catch {/* ignore */}
    set({ role: null, host: null, peer: null, myPeerId: "" });
  },
  select: (team, role) => {
    const s = get();
    if (s.role === "host") s.host?.localSelect(team, role);
    else s.peer?.select(team, role);
  },
  ready: (r) => {
    const s = get();
    if (s.role === "host") s.host?.localReady(r);
    else s.peer?.ready(r);
  },
  start: () => {
    const s = get();
    if (s.role === "host") s.host?.localStart();
    else s.peer?.start();
  },
  chat: (text) => {
    const s = get();
    if (s.role === "host") s.host?.localChat(text);
    else s.peer?.chat(text);
  },
  input: (payload) => {
    const s = get();
    if (s.role === "host") s.host?.localInput(payload);
    else s.peer?.input(payload);
  },
}));

// Re-export shared types for convenience in components
export type { GameSnapshot, MatchSummary };
