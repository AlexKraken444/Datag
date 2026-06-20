"use client";

// Datag — light cone visualization. Renders an additive triangle from the
// lighter toward its aim point with width derived from brightness. The
// displayed aim/pos/brightness are *interpolated* every frame toward the
// latest snapshot values so the cone moves smoothly at 60fps regardless of
// the underlying 30Hz network snapshot rate.

import { Graphics } from "pixi.js";
import { SHADOW } from "@/lib/constants";
import type { LighterState, Vec2 } from "@/types/game";

export class LightCone extends Graphics {
  // last value from network
  private targetAim: Vec2 = { x: 500, y: 500 };
  private targetPos: Vec2 = { x: 0, y: 0 };
  private targetBrightness = 1;
  // smoothed value used for rendering
  private currentAim: Vec2 = { x: 500, y: 500 };
  private currentPos: Vec2 = { x: 0, y: 0 };
  private currentBrightness = 1;
  private initialised = false;

  constructor(public team: "A" | "B") {
    super();
    this.blendMode = "add";
  }

  /** Called when a new snapshot lands — only updates targets, no redraw. */
  syncFromState(state: LighterState) {
    this.targetAim = { x: state.aim.x, y: state.aim.y };
    this.targetPos = { x: state.pos.x, y: state.pos.y };
    this.targetBrightness = state.brightness;
    if (!this.initialised) {
      this.currentAim = { ...this.targetAim };
      this.currentPos = { ...this.targetPos };
      this.currentBrightness = this.targetBrightness;
      this.initialised = true;
      this.redraw();
    }
  }

  /** Called on every PIXI ticker frame. */
  tick(deltaMS: number) {
    if (!this.initialised) return;
    // exponential approach — at deltaMS=16 (60fps), ~22% per frame
    const k = 1 - Math.exp(-deltaMS / 70);
    this.currentAim.x += (this.targetAim.x - this.currentAim.x) * k;
    this.currentAim.y += (this.targetAim.y - this.currentAim.y) * k;
    this.currentPos.x += (this.targetPos.x - this.currentPos.x) * k;
    this.currentPos.y += (this.targetPos.y - this.currentPos.y) * k;
    this.currentBrightness +=
      (this.targetBrightness - this.currentBrightness) * k;
    this.redraw();
  }

  private redraw() {
    this.clear();
    const pos = this.currentPos;
    const aim = this.currentAim;
    const b = this.currentBrightness;
    const dx = aim.x - pos.x;
    const dy = aim.y - pos.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const px = -ny;
    const py = nx;
    const half = Math.tan(SHADOW.CONE_ANGLE / 2);
    const reach = 240 + b * 380;

    const tipX = pos.x + nx * reach;
    const tipY = pos.y + ny * reach;
    const w = reach * half;
    const ax = tipX + px * w;
    const ay = tipY + py * w;
    const bx = tipX - px * w;
    const by = tipY - py * w;

    // halo
    const wh = w * 1.6;
    const ahx = tipX + px * wh;
    const ahy = tipY + py * wh;
    const bhx = tipX - px * wh;
    const bhy = tipY - py * wh;
    this.poly([pos.x, pos.y, ahx, ahy, bhx, bhy]).fill({
      color: 0xfff7c2,
      alpha: 0.05 + 0.06 * b,
    });
    // core
    this.poly([pos.x, pos.y, ax, ay, bx, by]).fill({
      color: 0xfff7c2,
      alpha: 0.12 + 0.14 * b,
    });
    // aim dot
    this.circle(aim.x, aim.y, 4).fill({
      color: 0xfff7c2,
      alpha: 0.55,
    });
  }
}
