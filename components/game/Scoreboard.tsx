"use client";

import { MATCH } from "@/lib/constants";
import type { ScoreState } from "@/types/game";

export function Scoreboard({ score }: { score: ScoreState }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-panel/80 border border-line backdrop-blur">
      <div className="text-red text-2xl font-bold w-8 text-center">{score.A}</div>
      <div className="text-muted text-sm">vs</div>
      <div className="text-blue text-2xl font-bold w-8 text-center">{score.B}</div>
      <div className="text-muted text-xs ml-2">до {MATCH.SCORE_TO_WIN}</div>
    </div>
  );
}
