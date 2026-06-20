"use client";

import { create } from "zustand";

export interface Settings {
  theme: "dark" | "light";
  volume: number;     // 0..1
  muted: boolean;
  fullscreen: boolean;
}

const KEY = "datag.settings.v1";

function load(): Settings {
  if (typeof window === "undefined")
    return { theme: "dark", volume: 0.8, muted: false, fullscreen: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...JSON.parse(raw) };
  } catch {/* ignore */}
  return { theme: "dark", volume: 0.8, muted: false, fullscreen: false };
}

function save(s: Settings) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}

interface Store extends Settings {
  set: (patch: Partial<Settings>) => void;
}

export const useSettingsStore = create<Store>((set, get) => ({
  ...load(),
  set: (patch) => {
    const next = { ...get(), ...patch };
    save({
      theme: next.theme,
      volume: next.volume,
      muted: next.muted,
      fullscreen: next.fullscreen,
    });
    set(patch);
  },
}));
