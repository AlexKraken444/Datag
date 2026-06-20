"use client";

// Datag — bootstraps a PIXI.Application sized to the arena and attaches it to
// a host <div>. We pre-create the layer containers used by the renderer.

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
      width: ARENA.SIZE,
      height: ARENA.SIZE,
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
