// Datak — fixed-step 60Hz simulation loop with a separate broadcast cadence.
// Runs in the host player's browser via window.setInterval.

import { TICK } from "@/lib/constants";

export type LoopCallbacks = {
  onStep: (dtMs: number) => void;
  onBroadcast: () => void;
};

export class HostLoop {
  private stepTimer: number | null = null;
  private broadcastTimer: number | null = null;

  constructor(private cb: LoopCallbacks) {}

  start() {
    if (this.stepTimer != null) return;
    const dtMs = 1000 / TICK.HZ;
    this.stepTimer = window.setInterval(() => this.cb.onStep(dtMs), dtMs);
    const bMs = 1000 / TICK.BROADCAST_HZ;
    this.broadcastTimer = window.setInterval(() => this.cb.onBroadcast(), bMs);
  }

  stop() {
    if (this.stepTimer != null) window.clearInterval(this.stepTimer);
    if (this.broadcastTimer != null) window.clearInterval(this.broadcastTimer);
    this.stepTimer = null;
    this.broadcastTimer = null;
  }
}
