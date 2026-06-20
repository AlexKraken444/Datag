"use client";

// Datag — translates raw keyboard/mouse/touch into PlayerInput payloads at
// 30Hz. Coordinates are arena-space; the host doesn't need to know about
// screen sizes.

import { ARENA } from "@/lib/constants";
import type { PlayerInput, Role } from "@/types/game";
import type { Keys } from "@/hooks/useKeyboard";
import type { MouseState } from "@/hooks/useMouse";

export interface SendFn {
  (input: PlayerInput): void;
}

export interface InputConfig {
  role: Role;
  containerSize: { w: number; h: number };
}

/** Continuous axes set by the virtual joystick (touch). */
export interface TouchAxes { x: number; y: number }
/** Discrete on-screen action buttons (touch). */
export interface TouchActions {
  sprint?: boolean;
  lmb?: boolean;
  rmb?: boolean;
}

export class InputSystem {
  private seq = 0;
  private timer: number | null = null;

  constructor(
    private cfg: InputConfig,
    private keys: React.RefObject<Keys>,
    private mouse: React.RefObject<MouseState>,
    private send: SendFn,
    private touchAxes?: React.RefObject<TouchAxes>,
    private touchActions?: React.RefObject<TouchActions>,
  ) {}

  start() {
    if (this.timer != null) return;
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
    const ax = this.touchAxes?.current ?? { x: 0, y: 0 };
    const act = this.touchActions?.current ?? {};

    this.seq += 1;
    const base: PlayerInput = { seq: this.seq, moveX: 0, moveY: 0 };

    // ---- movement: joystick wins if active, else keys ----
    const stickMag = Math.hypot(ax.x, ax.y);
    if (stickMag > 0.08) {
      base.moveX = ax.x;
      base.moveY = ax.y;
    } else {
      const left = k["KeyA"] || k["ArrowLeft"];
      const right = k["KeyD"] || k["ArrowRight"];
      const up = k["KeyW"] || k["ArrowUp"];
      const down = k["KeyS"] || k["ArrowDown"];
      base.moveX = (right ? 1 : 0) - (left ? 1 : 0);
      base.moveY = (down ? 1 : 0) - (up ? 1 : 0);
    }

    if (this.cfg.role === "TAGER") {
      base.sprint =
        !!k["ShiftLeft"] || !!k["ShiftRight"] || !!act.sprint;
    } else {
      // Mouse OR touch on the play area sets aim; both write to mouse.current.
      const cx =
        (m.x / this.cfg.containerSize.w) * ARENA.OUTER - ARENA.OFFSET;
      const cy =
        (m.y / this.cfg.containerSize.h) * ARENA.OUTER - ARENA.OFFSET;
      base.aimX = cx;
      base.aimY = cy;
      base.brightnessUp = !!m.lmb || !!act.lmb;
      base.brightnessDown = !!m.rmb || !!act.rmb;
    }
    this.send(base);
  }
}
