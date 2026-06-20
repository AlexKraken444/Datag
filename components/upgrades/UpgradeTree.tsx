"use client";

// Datag — upgrade tree component. Used on /profile and in the lobby.
// Each upgrade can be purchased exactly once.

import { useState } from "react";
import { motion } from "framer-motion";
import { useProfileStore } from "@/stores/useProfileStore";
import { UPGRADE_LIST } from "@/lib/upgrades";

export function UpgradeTree({ compact = false }: { compact?: boolean }) {
  const profile = useProfileStore((s) => s.profile);
  const buy = useProfileStore((s) => s.buyUpgrade);
  const [flash, setFlash] = useState<string | null>(null);

  function onBuy(id: string) {
    const res = buy(id as never);
    if (!res.ok) {
      setFlash(res.reason);
      setTimeout(() => setFlash(null), 1800);
    } else {
      setFlash(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold ${compact ? "text-base" : "text-xl"}`}>
          Древо прокачки
        </h2>
        <div className="text-sm">
          Баланс:{" "}
          <span className="text-accent font-bold">{profile.coins}</span>{" "}
          <span className="text-muted text-xs">tag-coins</span>
        </div>
      </div>
      {flash && (
        <div className="text-sm text-red px-3 py-2 rounded-md bg-red/10 border border-red/30">
          {flash}
        </div>
      )}
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "md:grid-cols-3"}`}>
        {UPGRADE_LIST.map((u, i) => {
          const owned = profile.upgrades.includes(u.id);
          const can = profile.coins >= u.cost;
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className={`rounded-lg border p-3 flex flex-col gap-2 ${
                owned
                  ? "border-accent bg-accent/5"
                  : can
                    ? "border-line bg-panel hover:border-accent/40"
                    : "border-line bg-panel/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="text-2xl">{u.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-muted">
                    Стоимость:{" "}
                    <span className="text-accent">{u.cost}</span> tag-coin
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted">{u.description}</div>
              <button
                disabled={owned || !can}
                onClick={() => onBuy(u.id)}
                className={`mt-1 text-sm py-2 rounded-md font-medium transition ${
                  owned
                    ? "bg-accent/20 text-accent cursor-default"
                    : can
                      ? "bg-accent text-black hover:brightness-110"
                      : "bg-panel border border-line text-muted cursor-not-allowed"
                }`}
              >
                {owned ? "Куплено" : can ? "Купить" : "Недостаточно"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
