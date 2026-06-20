// Datak — local profile data persisted to localStorage.

export type UpgradeId = "SPEED_BOOST" | "SHADOW_SHORT" | "EXTRA_LIFE";

export interface Profile {
  /** Stable id used to detect "first launch" / clear data. */
  id: string;
  nickname: string;
  coins: number;
  upgrades: UpgradeId[];
  matchesPlayed: number;
  createdAt: number;
}
