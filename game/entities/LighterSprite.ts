"use client";

import { Container, Graphics } from "pixi.js";
import { COLORS, LIGHTER } from "@/lib/constants";
import type { LighterState } from "@/types/game";

export class LighterSprite extends Container {
  private body = new Graphics();

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

  update(state: LighterState) {
    this.position.set(state.pos.x, state.pos.y);
  }
}
