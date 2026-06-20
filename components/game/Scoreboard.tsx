"use client";

import { MATCH } from "@/lib/constants";
import type { ScoreState } from "@/types/game";

export function Scoreboard({ score }: { score: ScoreState }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-panel/80 border border-line backdrop-blur">
      <div className="text-red text-xl sm:text-2xl font-bold w-6 sm:w-8 text-center">
        {score.A}
      </div>
      <div className="text-muted text-xs hidden sm:block">vs</div>
      <div className="text-muted text-xs sm:hidden">:</div>
      <div className="text-blue text-xl sm:text-2xl font-bold w-6 sm:w-8 text-center">
        {score.B}
      </div>
      <div className="text-muted text-[10px] sm:text-xs ml-1 sm:ml-2 hidden sm:inline">
        до {MATCH.SCORE_TO_WIN}
      </div>
    </div>
  );
}
