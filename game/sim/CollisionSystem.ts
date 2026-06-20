// Datak — hit detection: does Tager X stand on the shadow cast by team Y?
// Returns one or two hit events for this tick; Match decides bonus / draw.

import { tagerInShadow } from "@/lib/shadow";
import type { ShadowPoly, TagerState, Team } from "@/types/game";

export interface HitEvent {
  scoringTeam: Team;        // which team hit
  victimWasInStartZone: boolean;
}

export class CollisionSystem {
  detect(tagers: TagerState[], shadows: ShadowPoly[]): HitEvent[] {
    const events: HitEvent[] = [];
    for (const t of tagers) {
      // a tager steps on the OPPOSITE team's shadow (cast by their Lighter on their Tager).
      const enemyTeam: Team = t.team === "A" ? "B" : "A";
      const enemyShadow = shadows.find((s) => s.team === enemyTeam);
      const enemyTager = tagers.find((x) => x.team === enemyTeam);
      if (!enemyShadow || !enemyTager) continue;
      if (tagerInShadow(t.pos, enemyShadow)) {
        events.push({
          scoringTeam: t.team,
          victimWasInStartZone: enemyTager.inStartZone,
        });
      }
    }
    return events;
  }
}
