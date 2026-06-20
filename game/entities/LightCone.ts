"use client";

// Datag — light cone visualization. Renders an additive triangle from the
// lighter toward its aim point with width derived from brightness. Drawn
// with two passes (bright core + soft halo) so it reads clearly on the dark
// arena.

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
    const px = -ny;
    const py = nx;
    const half = Math.tan(SHADOW.CONE_ANGLE / 2);
    const reach = 240 + state.brightness * 380;

    const tipX = state.pos.x + nx * reach;
    const tipY = state.pos.y + ny * reach;
    const w = reach * half;
    const ax = tipX + px * w;
    const ay = tipY + py * w;
    const bx = tipX - px * w;
    const by = tipY - py * w;

    // halo: wider, soft
    const wh = w * 1.6;
    const ahx = tipX + px * wh;
    const ahy = tipY + py * wh;
    const bhx = tipX - px * wh;
    const bhy = tipY - py * wh;
    this.poly([state.pos.x, state.pos.y, ahx, ahy, bhx, bhy]).fill({
      color: 0xfff7c2,
      alpha: 0.05 + 0.06 * state.brightness,
    });

    // core
    this.poly([state.pos.x, state.pos.y, ax, ay, bx, by]).fill({
      color: 0xfff7c2,
      alpha: 0.12 + 0.14 * state.brightness,
    });

    // small bright dot at the aim point so the player sees where they point
    this.circle(state.aim.x, state.aim.y, 4).fill({
      color: 0xfff7c2,
      alpha: 0.55,
    });
  }
}
