"use client";

// Datag — light cone visualization. Renders an additive triangle from the
// lighter toward its aim point with width derived from brightness.

import { Graphics } from "pixi.js";
import { SHADOW } from "@/lib/constants";
import type { LighterState } from "@/types/game";

export class LightCone extends Graphics {
  constructor(public team: "A" | "B") {
    super();
    this.blendMode = "add";
  }

  update(state: LighterState) {
    this.clear();
    const dx = state.aim.x - state.pos.x;
    const dy = state.aim.y - state.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    // perpendicular
    const px = -ny;
    const py = nx;
    const half = Math.tan(SHADOW.CONE_ANGLE / 2);
    // reach = brightness * a bit further than the shadow length
    const reach = 280 + state.brightness * 320;

    const tipX = state.pos.x + nx * reach;
    const tipY = state.pos.y + ny * reach;
    const w = reach * half;
    const ax = tipX + px * w;
    const ay = tipY + py * w;
    const bx = tipX - px * w;
    const by = tipY - py * w;

    this.poly([state.pos.x, state.pos.y, ax, ay, bx, by]).fill({
      color: 0xfff7c2,
      alpha: 0.07 + 0.08 * state.brightness,
    });
  }
}
