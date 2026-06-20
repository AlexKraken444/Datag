"use client";

// Datag — persistent local profile (nickname, tag-coins, owned upgrades).
// Backed by localStorage; survives navigation, refresh, and tab close.

import { create } from "zustand";
import type { Profile, UpgradeId } from "@/types/profile";
import { UPGRADES } from "@/lib/upgrades";

const KEY = "datag.profile.v1";

function load(): Profile {
  if (typeof window === "undefined") return blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const p = JSON.parse(raw) as Profile;
    // sanitise; ignore upgrade ids we no longer know about
    return {
      id: String(p.id || newId()),
      nickname: String(p.nickname || ""),
      coins: Math.max(0, p.coins | 0),
      upgrades: Array.isArray(p.upgrades)
        ? p.upgrades.filter((u): u is UpgradeId => u in UPGRADES)
        : [],
      matchesPlayed: Math.max(0, p.matchesPlayed | 0),
      createdAt: Number(p.createdAt) || Date.now(),
    };
  } catch {
    return blank();
  }
}

function blank(): Profile {
  return {
    id: newId(),
    nickname: "",
    coins: 0,
    upgrades: [],
    matchesPlayed: 0,
    createdAt: Date.now(),
  };
}

function newId(): string {
  return "u_" + Math.random().toString(36).slice(2, 10);
}

function save(p: Profile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota or privacy mode */
  }
}

interface ProfileStore {
  profile: Profile;
  isRegistered: () => boolean;
  setNickname: (nick: string) => void;
  addCoins: (n: number) => void;
  buyUpgrade: (id: UpgradeId) => { ok: true } | { ok: false; reason: string };
  resetUpgrades: () => void;
  hardReset: () => void;
  recordMatch: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: load(),
  isRegistered: () => get().profile.nickname.trim().length >= 2,

  setNickname: (nick) => {
    const trimmed = nick.trim().slice(0, 16);
    const next = { ...get().profile, nickname: trimmed };
    save(next);
    set({ profile: next });
  },

  addCoins: (n) => {
    if (!n) return;
    const next = {
      ...get().profile,
      coins: Math.max(0, get().profile.coins + n),
    };
    save(next);
    set({ profile: next });
  },

  buyUpgrade: (id) => {
    const p = get().profile;
    const def = UPGRADES[id];
    if (!def) return { ok: false, reason: "Неизвестный апгрейд" };
    if (p.upgrades.includes(id))
      return { ok: false, reason: "Уже куплено" };
    if (p.coins < def.cost)
      return { ok: false, reason: "Не хватает Tag-coin" };
    const next: Profile = {
      ...p,
      coins: p.coins - def.cost,
      upgrades: [...p.upgrades, id],
    };
    save(next);
    set({ profile: next });
    return { ok: true };
  },

  resetUpgrades: () => {
    const next = { ...get().profile, upgrades: [] };
    save(next);
    set({ profile: next });
  },

  hardReset: () => {
    const next = blank();
    save(next);
    set({ profile: next });
  },

  recordMatch: () => {
    const next = {
      ...get().profile,
      matchesPlayed: get().profile.matchesPlayed + 1,
    };
    save(next);
    set({ profile: next });
  },
}));
