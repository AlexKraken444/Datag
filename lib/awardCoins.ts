// Datak — apply a MatchSummary to the local profile: award personal
// tag-coins and bump matches-played. Idempotent guard via match id stored
// in sessionStorage so a re-mount doesn't double-credit.

import { useProfileStore } from "@/stores/useProfileStore";
import type { MatchSummary } from "@/types/game";

const KEY = "datag.awarded.match.v1";

export function awardCoinsToProfile(summary: MatchSummary) {
  if (typeof window === "undefined") return;
  try {
    const seen = sessionStorage.getItem(KEY);
    if (seen === summary.id) return;
    sessionStorage.setItem(KEY, summary.id);
  } catch {
    /* ignore quota */
  }

  // find my entry by id OR by nickname (peer ids change per match)
  const me = useProfileStore.getState().profile;
  const mine =
    summary.players.find((p) => p.nickname === me.nickname) ?? null;
  if (mine && mine.coinsEarned > 0) {
    useProfileStore.getState().addCoins(mine.coinsEarned);
  }
  useProfileStore.getState().recordMatch();
}
