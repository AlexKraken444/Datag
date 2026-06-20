"use client";

// Datak — interprets host snapshots into Pixi scene mutations.
// Snapshots arrive at ~30Hz; cone + lighter positions interpolate every
// PIXI frame via a ticker callback for 60fps smooth movement.

import { Graphics } from "pixi.js";
import type { PixiApp } from "./PixiApp";
import type { GameSnapshot } from "@/types/game";
import { drawArena } from "../entities/Arena";
import { TagerSprite } from "../entities/TagerSprite";
import { LighterSprite } from "../entities/LighterSprite";
import { LightCone } from "../entities/LightCone";
import { ShadowPolygon } from "../entities/ShadowPolygon";
import { tagerInShadow } from "@/lib/shadow";

interface Sprites {
  tagers: Map<string, { sp: TagerSprite; team: "A" | "B" }>;
  lighters: Map<string, { sp: LighterSprite; cone: LightCone; team: "A" | "B" }>;
  shadows: { A: ShadowPolygon; B: ShadowPolygon };
}

export class Renderer {
  private bgDrawn = false;
  private bg = new Graphics();
  private sprites: Sprites = {
    tagers: new Map(),
    lighters: new Map(),
    shadows: { A: new ShadowPolygon("A"), B: new ShadowPolygon("B") },
  };
  private nicks: Record<string, string> = {};
  private tickerFn: ((t: { deltaMS: number }) => void) | null = null;

  constructor(private app: PixiApp) {}

  setNicknames(map: Record<string, string>) {
    this.nicks = { ...this.nicks, ...map };
  }

  init() {
    if (this.bgDrawn) return;
    this.app.layers.bg.addChild(this.bg);
    drawArena(this.bg);
    this.app.layers.shadows.addChild(this.sprites.shadows.A);
    this.app.layers.shadows.addChild(this.sprites.shadows.B);

    // per-frame interpolation
    this.tickerFn = (t) => {
      const dt = t.deltaMS;
      for (const [, e] of this.sprites.lighters) {
        e.sp.tick(dt);
        e.cone.tick(dt);
      }
    };
    this.app.app.ticker.add(this.tickerFn);
    this.bgDrawn = true;
  }

  apply(snapshot: GameSnapshot) {
    this.init();

    // tagers
    const seenT = new Set<string>();
    for (const t of snapshot.tagers) {
      seenT.add(t.id);
      let entry = this.sprites.tagers.get(t.id);
      if (!entry) {
        const sp = new TagerSprite(t.team, this.nicks[t.id] ?? "");
        this.app.layers.entities.addChild(sp);
        entry = { sp, team: t.team };
        this.sprites.tagers.set(t.id, entry);
      }
      entry.sp.update(t);
    }
    for (const [id, e] of this.sprites.tagers) {
      if (!seenT.has(id)) {
        this.app.layers.entities.removeChild(e.sp);
        this.sprites.tagers.delete(id);
      }
    }

    // lighters + cones — push targets, ticker handles smooth motion
    const seenL = new Set<string>();
    for (const l of snapshot.lighters) {
      seenL.add(l.id);
      let entry = this.sprites.lighters.get(l.id);
      if (!entry) {
        const sp = new LighterSprite(l.team);
        const cone = new LightCone(l.team);
        this.app.layers.entities.addChild(sp);
        this.app.layers.light.addChild(cone);
        entry = { sp, cone, team: l.team };
        this.sprites.lighters.set(l.id, entry);
      }
      entry.sp.syncFromState(l);
      entry.cone.syncFromState(l);
    }
    for (const [id, e] of this.sprites.lighters) {
      if (!seenL.has(id)) {
        this.app.layers.entities.removeChild(e.sp);
        this.app.layers.light.removeChild(e.cone);
        this.sprites.lighters.delete(id);
      }
    }

    // shadows — flag "danger" if enemy Tager is standing on it (red outline)
    for (const sh of snapshot.shadows) {
      const enemy = snapshot.tagers.find((t) => t.team !== sh.team);
      const danger = enemy ? tagerInShadow(enemy.pos, sh) : false;
      this.sprites.shadows[sh.team].update(sh, danger);
    }
  }

  destroy() {
    if (this.tickerFn) this.app.app.ticker.remove(this.tickerFn);
    this.tickerFn = null;
  }
}
