"use client";

import { motion } from "framer-motion";

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 select-none"
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#19f4d6" />
            <stop offset="1" stopColor="#3aa6ff" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="10" stroke="url(#g)" strokeWidth="2.5" />
        <polygon points="14,46 32,18 50,46" fill="none" stroke="#ff4757" strokeWidth="2" />
        <polygon points="32,18 50,46 32,38" fill="#0a0d12" stroke="#19f4d6" strokeWidth="1.5" />
      </svg>
      <div className="leading-tight">
        <div className="text-2xl font-bold glow-text">DATAG</div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted">shadow arena</div>
      </div>
    </motion.div>
  );
}
