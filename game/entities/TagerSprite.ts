"use client";

import { Container, Graphics, Text } from "pixi.js";
import { COLORS, TAGER } from "@/lib/constants";
import type { TagerState } from "@/types/game";

export class TagerSprite extends Container {
  private body = new Graphics();
  private nickLabel: Text;

  constructor(public team: "A" | "B", nick: string) {
    super();
    this.addChild(this.body);
    this.nickLabel = new Text({
      text: nick,
      style: {
        fill: 0xffffff,
        fontSize: 13,
        fontWeight: "600",
        align: "center",
      },
    });
    this.nickLabel.anchor.set(0.5, 1.4);
    this.addChild(this.nickLabel);
    this.draw(false);
  }

  draw(highlight: boolean) {
    const c = this.team === "A" ? COLORS.TEAM_A : COLORS.TEAM_B;
    this.body.clear();
    // outer aura
    this.body
      .circle(0, 0, TAGER.RADIUS + 6)
      .fill({ color: Number("0x" + c.slice(1)), alpha: highlight ? 0.45 : 0.15 });
    // body
    this.body
      .circle(0, 0, TAGER.RADIUS)
      .fill({ color: Number("0x" + c.slice(1)) })
      .stroke({ color: 0xffffff, width: 2, alpha: 0.85 });
  }

  update(state: TagerState) {
    this.position.set(state.pos.x, state.pos.y);
  }
}
