"use client";

import { create } from "zustand";
import type { GameSnapshot, MatchSummary } from "@/types/game";

interface GameStore {
  snapshot: GameSnapshot | null;
  setSnapshot: (s: GameSnapshot) => void;
  summary: MatchSummary | null;
  setSummary: (s: MatchSummary | null) => void;
  // local UX
  lastEvent: { type: "hit" | "draw"; text: string; ts: number } | null;
  setLastEvent: (e: GameStore["lastEvent"]) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  snapshot: null,
  setSnapshot: (s) => set({ snapshot: s }),
  summary: null,
  setSummary: (s) => set({ summary: s }),
  lastEvent: null,
  setLastEvent: (e) => set({ lastEvent: e }),
  reset: () => set({ snapshot: null, summary: null, lastEvent: null }),
}));
