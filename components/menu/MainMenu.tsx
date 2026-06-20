"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

const items = [
  { href: "/create", label: "Создать комнату", hot: true },
  { href: "/join", label: "Подключиться по коду" },
  { href: "/leaderboard", label: "Лидерборд" },
  { href: "/history", label: "История матчей" },
  { href: "/settings", label: "Настройки" },
];

export function MainMenu() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8">
      <Logo size={88} />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted max-w-md text-center"
      >
        Командная 2v2-арена с динамическими тенями. Один игрок управляет
        бойцом, другой — прожектором. Наступи на тень врага.
      </motion.p>

      <div className="w-full max-w-md flex flex-col gap-3">
        {items.map((it, i) => (
          <motion.div
            key={it.href}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link
              href={it.href}
              className={`block w-full text-center py-3 rounded-md border transition ${
                it.hot
                  ? "bg-accent text-black border-accent font-semibold hover:brightness-110 pulse-glow"
                  : "bg-panel border-line hover:border-accent/50"
              }`}
            >
              {it.label}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-muted/70 tracking-widest">
        SHADOWS · LIGHTS · 2v2
      </div>
    </div>
  );
}
