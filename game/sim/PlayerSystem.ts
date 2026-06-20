// Datag — Tager movement (authoritative).
//
// Inputs are clamped: moveX/moveY must form a unit-or-less vector. Sprint
// drains stamina; we never trust client position. Upgrades are passed as a
// set of ids so the system stays decoupled from the profile schema.

import { ARENA, TAGER, TICK } from "@/lib/constants";
import { clamp } from "@/lib/geometry";
import type { PlayerInput, TagerState } from "@/types/game";
import { isInTagerZone } from "@/lib/zones";
import { UPGRADE_EFFECTS } from "@/lib/upgrades";

export class PlayerSystem {
  step(t: TagerState, input: PlayerInput | null, upgrades: Set<string>) {
    if (!input) {
      t.stamina = Math.min(
        TAGER.SPRINT_STAMINA_MAX,
        t.stamina + TAGER.SPRINT_REGEN * TICK.DT,
      );
      return;
    }
    const mx = clamp(input.moveX, -1, 1);
    const my = clamp(input.moveY, -1, 1);
    const mag = Math.hypot(mx, my) || 1;
    const dx = mx / mag;
    const dy = my / mag;

    const wantSprint = !!input.sprint && t.stamina > 0;
    const baseSpeed =
      TAGER.SPEED *
      (upgrades.has("SPEED_BOOST") ? UPGRADE_EFFECTS.SPEED_MULT : 1);
    const speed = baseSpeed * (wantSprint ? TAGER.SPRINT_MULT : 1);

    t.vel.x = dx * speed * (mx || my ? 1 : 0);
    t.vel.y = dy * speed * (mx || my ? 1 : 0);

    t.pos.x = clamp(t.pos.x + t.vel.x * TICK.DT, TAGER.RADIUS, ARENA.SIZE - TAGER.RADIUS);
    t.pos.y = clamp(t.pos.y + t.vel.y * TICK.DT, TAGER.RADIUS, ARENA.SIZE - TAGER.RADIUS);

    if (wantSprint && (mx || my)) {
      t.stamina = Math.max(0, t.stamina - TAGER.SPRINT_DRAIN * TICK.DT);
    } else {
      t.stamina = Math.min(
        TAGER.SPRINT_STAMINA_MAX,
        t.stamina + TAGER.SPRINT_REGEN * TICK.DT,
      );
    }

    t.inStartZone = isInTagerZone(t.team, t.pos);
  }
}
