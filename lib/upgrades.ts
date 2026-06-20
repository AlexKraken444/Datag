// Datak — upgrade catalog. Single source of truth for cost / effect numbers.

import type { UpgradeId } from "@/types/profile";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  cost: number;
  icon: string; // emoji or short label
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  SPEED_BOOST: {
    id: "SPEED_BOOST",
    name: "Усиленный бег",
    description: "Скорость Tager-а +25% постоянно.",
    cost: 10,
    icon: "⚡",
  },
  SHADOW_SHORT: {
    id: "SHADOW_SHORT",
    name: "Короткая тень",
    description: "Твоя тень короче на 30 единиц — сопернику сложнее наступить.",
    cost: 100,
    icon: "🕶",
  },
  EXTRA_LIFE: {
    id: "EXTRA_LIFE",
    name: "Запасная жизнь",
    description: "Сопернику придётся наступить на твою тень дважды, чтобы получить очко.",
    cost: 500,
    icon: "❤",
  },
};

export const UPGRADE_LIST: UpgradeDef[] = [
  UPGRADES.SPEED_BOOST,
  UPGRADES.SHADOW_SHORT,
  UPGRADES.EXTRA_LIFE,
];

// Numeric effects — read by simulation systems
export const UPGRADE_EFFECTS = {
  SPEED_MULT: 1.25,        // SPEED_BOOST
  SHADOW_SHORTEN_PX: 30,   // SHADOW_SHORT
  EXTRA_LIFE_HP: 2,        // EXTRA_LIFE: 2 HP per round
} as const;
