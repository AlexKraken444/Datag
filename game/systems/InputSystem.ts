"use client";

// Datag — translates raw keyboard/mouse into PlayerInput payloads at a steady
// rate (matches server broadcast). Coordinates are in arena space so the
// server doesn't need to know about screen sizes.

import { ARENA } from "@/lib/constants";
import type { PlayerInput, Role } from "@/types/game";
import type { Keys } from "@/hooks/useKeyboard";
import type { MouseState } from "@/hooks/useMouse";

export interface SendFn {
  (input: PlayerInput): void;
}

export interface InputConfig {
  role: Role;
  // size of the rendered canvas in pixels (used to map mouse -> arena coords)
  containerSize: { w: number; h: number };
}

export class InputSystem {
  private seq = 0;
  private timer: number | null = null;

  constructor(
    private cfg: InputConfig,
    private keys: React.RefObject<Keys>,
    private mouse: React.RefObject<MouseState>,
    private send: SendFn,
  ) {}

  start() {
    if (this.timer != null) return;
    // 30Hz matches server broadcast rate
    this.timer = window.setInterval(() => this.tick(), 1000 / 30);
  }

  stop() {
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = null;
  }

  setConfig(c: Partial<InputConfig>) {
    this.cfg = { ...this.cfg, ...c };
  }

  private tick() {
    const k = this.keys.current ?? {};
    const m = this.mouse.current ?? { x: 0, y: 0, lmb: false, rmb: false };
    this.seq += 1;
    const base: PlayerInput = { seq: this.seq, moveX: 0, moveY: 0 };

    if (this.cfg.role === "TAGER") {
      const left = k["KeyA"] || k["ArrowLeft"];
      const right = k["KeyD"] || k["ArrowRight"];
      const up = k["KeyW"] || k["ArrowUp"];
      const down = k["KeyS"] || k["ArrowDown"];
      base.moveX = (right ? 1 : 0) - (left ? 1 : 0);
      base.moveY = (down ? 1 : 0) - (up ? 1 : 0);
      base.sprint = !!k["ShiftLeft"] || !!k["ShiftRight"];
    } else {
      // Lighter zone is a vertical strip on the side: A/D nudges horizontally,
      // W/S nudges along the strip — the server clamps to the AABB either way.
      const left = k["KeyA"] || k["ArrowLeft"];
      const right = k["KeyD"] || k["ArrowRight"];
      const up = k["KeyW"] || k["ArrowUp"];
      const down = k["KeyS"] || k["ArrowDown"];
      base.moveX = (right ? 1 : 0) - (left ? 1 : 0);
      base.moveY = (down ? 1 : 0) - (up ? 1 : 0);
      // mouse -> arena coordinates
      const ax = (m.x / this.cfg.containerSize.w) * ARENA.SIZE;
      const ay = (m.y / this.cfg.containerSize.h) * ARENA.SIZE;
      base.aimX = ax;
      base.aimY = ay;
      base.brightnessUp = m.lmb;
      base.brightnessDown = m.rmb;
    }
    this.send(base);
  }
}
