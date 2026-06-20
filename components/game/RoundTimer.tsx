"use client";

import type { RoundState } from "@/types/game";
import { motion, AnimatePresence } from "framer-motion";

export function RoundTimer({ round }: { round: RoundState }) {
  if (round.phase === "COUNTDOWN") {
    const sec = Math.ceil(round.countdownLeftMs / 1000);
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={sec}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.4 }}
            className="text-[80px] sm:text-[120px] font-black glow-text"
          >
            {sec > 0 ? sec : "GO"}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
  if (round.phase === "POST" && round.lastHit) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-4xl font-bold text-center px-3"
        >
          <span className={round.lastHit.team === "A" ? "text-red" : "text-blue"}>
            +{round.lastHit.bonus ? 2 : 1}
          </span>
          <span className="text-muted ml-2 text-base">
            {round.lastHit.bonus ? "бонус: в стартовой зоне" : ""}
          </span>
        </motion.div>
      </div>
    );
  }
  if (round.phase === "POST") {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-3xl font-bold text-muted">Ничья</div>
      </div>
    );
  }
  return null;
}
