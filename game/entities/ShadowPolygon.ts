"use client";

import { Graphics } from "pixi.js";
import type { ShadowPoly } from "@/types/game";

export class ShadowPolygon extends Graphics {
  constructor(public team: "A" | "B") {
    super();
  }

  update(poly: ShadowPoly, danger: boolean) {
    this.clear();
    const pts = poly.points.flatMap((p) => [p.x, p.y]);
    // base shadow
    this.poly(pts).fill({ color: 0x000000, alpha: 0.65 });
    // outline — red when the local Tager is on it
    this.poly(pts).stroke({
      color: danger ? 0xff4757 : 0x111419,
      width: danger ? 2.5 : 1,
      alpha: danger ? 0.9 : 0.5,
    });
  }
}
