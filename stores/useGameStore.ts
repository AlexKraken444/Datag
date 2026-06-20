"use client";

import { create } from "zustand";
import type { GameSnapshot, MatchSummary, Team } from "@/types/game";

interface GameStore {
  snapshot: GameSnapshot | null;
  setSnapshot: (s: GameSnapshot) => void;
  summary: MatchSummary | null;
  setSummary: (s: MatchSummary | null) => void;
  lastRoundEnd: {
    scoredBy?: Team;
    bonus?: boolean;
    draw?: boolean;
    score: { A: number; B: number };
    ts: number;
  } | null;
  setLastRoundEnd: (e: GameStore["lastRoundEnd"]) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  snapshot: null,
  setSnapshot: (s) => set({ snapshot: s }),
  summary: null,
  setSummary: (s) => set({ summary: s }),
  lastRoundEnd: null,
  setLastRoundEnd: (e) => set({ lastRoundEnd: e }),
  reset: () =>
    set({ snapshot: null, summary: null, lastRoundEnd: null }),
}));
