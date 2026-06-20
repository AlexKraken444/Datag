// Datag — recompute both shadow polygons each tick.

import { computeShadow } from "@/lib/shadow";
import type {
  LighterState,
  ShadowPoly,
  TagerState,
  Team,
} from "@/types/game";

export class ShadowSystem {
  compute(tagers: TagerState[], lighters: LighterState[]): ShadowPoly[] {
    const out: ShadowPoly[] = [];
    for (const team of ["A", "B"] as Team[]) {
      const tager = tagers.find((t) => t.team === team);
      const lighter = lighters.find((l) => l.team === team);
      if (!tager || !lighter) continue;
      out.push(
        computeShadow({
          team,
          lightPos: lighter.pos,
          lightAim: lighter.aim,
          brightness: lighter.brightness,
          tagerPos: tager.pos,
        }),
      );
    }
    return out;
  }
}
