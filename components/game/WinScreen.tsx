"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MatchSummary } from "@/types/game";

export function WinScreen({
  summary,
  roomCode,
}: {
  summary: MatchSummary;
  roomCode: string;
}) {
  const winText =
    summary.winner === "DRAW"
      ? "Ничья"
      : `Победа команды ${summary.winner}`;
  const color =
    summary.winner === "A"
      ? "text-red"
      : summary.winner === "B"
        ? "text-blue"
        : "text-muted";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-bg/90 backdrop-blur flex items-center justify-center px-6"
    >
      <div className="card max-w-lg w-full text-center flex flex-col gap-4">
        <div className="text-sm uppercase tracking-[0.3em] text-muted">match over</div>
        <div className={`text-5xl font-black ${color} glow-text`}>{winText}</div>
        <div className="text-3xl font-mono">
          <span className="text-red">{summary.scoreA}</span>
          <span className="text-muted mx-3">:</span>
          <span className="text-blue">{summary.scoreB}</span>
        </div>
        <div className="text-left mt-2">
          <div className="text-sm text-muted mb-1">Игроки:</div>
          <ul className="text-sm space-y-1">
            {summary.players.map((p) => (
              <li
                key={p.nickname + p.team + p.role}
                className="flex justify-between border-b border-line py-1"
              >
                <span>
                  <span
                    className={p.team === "A" ? "text-red" : "text-blue"}
                  >
                    {p.team}
                  </span>{" "}
                  · {p.nickname} <span className="text-muted">/{p.role}</span>
                </span>
                <span className="text-accent">{p.hits} hits</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href={`/room/${roomCode}`} className="btn-primary">
            Реванш
          </Link>
          <Link href="/" className="btn">В меню</Link>
        </div>
      </div>
    </motion.div>
  );
}
