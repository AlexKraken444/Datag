"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
};

export function Button({ className = "", variant = "default", ...rest }: Props) {
  const cls =
    variant === "primary"
      ? "btn-primary"
      : variant === "ghost"
        ? "btn-ghost"
        : variant === "danger"
          ? "px-4 py-2 rounded-md bg-red/90 text-white font-semibold hover:brightness-110 transition"
          : "btn";
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      className={`${cls} ${className}`}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    />
  );
}
