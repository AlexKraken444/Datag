"use client";

// Datag — bootstraps a PIXI.Application sized to the arena + Lighter ring
// and attaches it to a host <div>. All layers are offset by ARENA.OFFSET so
// that arena (0,0) lands inside the canvas while the perimeter ring fits
// around it.

import { Application, Container } from "pixi.js";
import { ARENA, COLORS } from "@/lib/constants";

export interface PixiLayers {
  bg: Container;
  shadows: Container;
  entities: Container;
  light: Container;
  hud: Container;
}

export class PixiApp {
  app: Application;
  layers!: PixiLayers;
  ready = false;

  constructor() {
    this.app = new Application();
  }

  async init(host: HTMLDivElement) {
    await this.app.init({
      width: ARENA.OUTER,
      height: ARENA.OUTER,
      background: COLORS.ARENA_BG,
      antialias: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
    });
    host.appendChild(this.app.canvas);
    this.app.canvas.style.width = "100%";
    this.app.canvas.style.height = "100%";
    this.app.canvas.style.display = "block";
    this.app.canvas.oncontextmenu = (e) => e.preventDefault();

    this.layers = {
      bg: new Container(),
      shadows: new Container(),
      entities: new Container(),
      light: new Container(),
      hud: new Container(),
    };
    // shift world so arena (0,0) is at canvas (OFFSET, OFFSET)
    for (const c of [
      this.layers.bg,
      this.layers.shadows,
      this.layers.entities,
      this.layers.light,
      this.layers.hud,
    ]) {
      c.position.set(ARENA.OFFSET, ARENA.OFFSET);
    }
    this.app.stage.addChild(
      this.layers.bg,
      this.layers.shadows,
      this.layers.light,
      this.layers.entities,
      this.layers.hud,
    );
    this.ready = true;
  }

  destroy() {
    try {
      this.app.destroy(true, { children: true, texture: true });
    } catch {
      /* noop */
    }
  }
}
