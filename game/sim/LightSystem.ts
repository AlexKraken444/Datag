// Datag — Lighter movement and aim.
//
// The Lighter is locked to its team's rectangular zone; the aim point is free
// (anywhere on the map). Brightness ramps while LMB/RMB are held.

import { LIGHTER, TICK } from "@/lib/constants";
import { clamp, clampToAABB } from "@/lib/geometry";
import { LighterZones } from "@/lib/zones";
import type { LighterState, PlayerInput } from "@/types/game";

export class LightSystem {
  step(l: LighterState, input: PlayerInput | null) {
    const zone = LighterZones[l.team].rect;
    if (input) {
      const mx = clamp(input.moveX, -1, 1);
      const my = clamp(input.moveY, -1, 1);
      l.pos.x += mx * LIGHTER.SPEED * TICK.DT;
      l.pos.y += my * LIGHTER.SPEED * TICK.DT;
      l.pos = clampToAABB(l.pos, zone);

      if (typeof input.aimX === "number" && typeof input.aimY === "number") {
        l.aim.x = input.aimX;
        l.aim.y = input.aimY;
      }
      if (input.brightnessUp) {
        l.brightness = Math.min(
          LIGHTER.BRIGHTNESS_MAX,
          l.brightness + LIGHTER.BRIGHTNESS_STEP * TICK.DT,
        );
      }
      if (input.brightnessDown) {
        l.brightness = Math.max(
          LIGHTER.BRIGHTNESS_MIN,
          l.brightness - LIGHTER.BRIGHTNESS_STEP * TICK.DT,
        );
      }
    } else {
      l.pos = clampToAABB(l.pos, zone);
    }
  }
}
