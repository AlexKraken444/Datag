"use client";

import { Container, Graphics } from "pixi.js";
import { COLORS, LIGHTER } from "@/lib/constants";
import type { LighterState, Vec2 } from "@/types/game";

export class LighterSprite extends Container {
  private body = new Graphics();
  private targetPos: Vec2 = { x: 0, y: 0 };
  private currentPos: Vec2 = { x: 0, y: 0 };
  private initialised = false;

  constructor(public team: "A" | "B") {
    super();
    this.addChild(this.body);
    this.draw();
  }

  draw() {
    const c = this.team === "A" ? COLORS.TEAM_A : COLORS.TEAM_B;
    this.body.clear();
    this.body
      .circle(0, 0, LIGHTER.RADIUS)
      .fill({ color: Number("0x" + c.slice(1)) })
      .stroke({ color: 0xffffff, width: 2, alpha: 0.85 });
    this.body.circle(0, 0, LIGHTER.RADIUS + 4).stroke({
      color: 0xfff7c2,
      width: 1,
      alpha: 0.7,
    });
  }

  syncFromState(state: LighterState) {
    this.targetPos = { x: state.pos.x, y: state.pos.y };
    if (!this.initialised) {
      this.currentPos = { ...this.targetPos };
      this.position.set(this.currentPos.x, this.currentPos.y);
      this.initialised = true;
    }
  }

  tick(deltaMS: number) {
    if (!this.initialised) return;
    const k = 1 - Math.exp(-deltaMS / 70);
    this.currentPos.x += (this.targetPos.x - this.currentPos.x) * k;
    this.currentPos.y += (this.targetPos.y - this.currentPos.y) * k;
    this.position.set(this.currentPos.x, this.currentPos.y);
  }
}
