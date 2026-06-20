// Datak — recompute both shadow polygons each tick. The Tager's own upgrades
// can shorten the shadow it casts (SHADOW_SHORT).

import { computeShadow } from "@/lib/shadow";
import { UPGRADE_EFFECTS } from "@/lib/upgrades";
import type {
  LighterState,
  ShadowPoly,
  TagerState,
  Team,
} from "@/types/game";

export class ShadowSystem {
  compute(
    tagers: TagerState[],
    lighters: LighterState[],
    tagerUpgrades: Map<string, Set<string>>,
  ): ShadowPoly[] {
    const out: ShadowPoly[] = [];
    for (const team of ["A", "B"] as Team[]) {
      const tager = tagers.find((t) => t.team === team);
      const lighter = lighters.find((l) => l.team === team);
      if (!tager || !lighter) continue;
      const up = tagerUpgrades.get(tager.id) ?? new Set<string>();
      out.push(
        computeShadow({
          team,
          lightPos: lighter.pos,
          lightAim: lighter.aim,
          brightness: lighter.brightness,
          tagerPos: tager.pos,
          shorterBy: up.has("SHADOW_SHORT")
            ? UPGRADE_EFFECTS.SHADOW_SHORTEN_PX
            : 0,
        }),
      );
    }
    return out;
  }
}
