"use client";

import { motion } from "framer-motion";
import { useProfileStore } from "@/stores/useProfileStore";

export function ProfileCard({ compact = false }: { compact?: boolean }) {
  const p = useProfileStore((s) => s.profile);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card flex items-center gap-4 ${compact ? "py-2" : ""}`}
    >
      <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-accent text-xl font-bold">
        {(p.nickname || "?").slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-ink">
          {p.nickname || "Без ника"}
        </div>
        <div className="text-xs text-muted">
          Матчей: {p.matchesPlayed} · Прокачек: {p.upgrades.length}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-accent">
          {p.coins}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted">
          tag-coins
        </div>
      </div>
    </motion.div>
  );
}
