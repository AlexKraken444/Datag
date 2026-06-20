// Datak — Lighter movement (perimeter ring) and free aim.
//
// The Lighter slides around the entire arena perimeter; WASD moves both axes
// and the ring clamp keeps the Lighter outside the arena interior. Aim is
// free (anywhere on the map); brightness ramps while LMB/RMB are held.

import { LIGHTER, TICK } from "@/lib/constants";
import { clamp } from "@/lib/geometry";
import { stepPerimeter } from "@/lib/zones";
import type { LighterState, PlayerInput } from "@/types/game";

export class LightSystem {
  step(l: LighterState, input: PlayerInput | null) {
    if (input) {
      const mx = clamp(input.moveX, -1, 1);
      const my = clamp(input.moveY, -1, 1);
      // normalize diagonal speed so corner movement isn't √2× faster
      const mag = Math.hypot(mx, my);
      const ux = (mag > 1 ? mx / mag : mx) * LIGHTER.SPEED * TICK.DT;
      const uy = (mag > 1 ? my / mag : my) * LIGHTER.SPEED * TICK.DT;
      l.pos = stepPerimeter(l.pos, ux, uy);

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
      // keep position on the ring (e.g. after rejoin / snapshot interp)
      l.pos = stepPerimeter(l.pos, 0, 0);
    }
  }
}
