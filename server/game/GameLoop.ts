// Datag — fixed-step 60Hz simulation loop with a separate broadcast cadence.

import { TICK } from "@/lib/constants";

export type LoopCallbacks = {
  onStep: (dtMs: number) => void;
  onBroadcast: () => void;
};

export class GameLoop {
  private timer: NodeJS.Timeout | null = null;
  private broadcastTimer: NodeJS.Timeout | null = null;

  constructor(private cb: LoopCallbacks) {}

  start() {
    if (this.timer) return;
    const dtMs = 1000 / TICK.HZ;
    this.timer = setInterval(() => this.cb.onStep(dtMs), dtMs);
    const bMs = 1000 / TICK.BROADCAST_HZ;
    this.broadcastTimer = setInterval(() => this.cb.onBroadcast(), bMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    this.timer = null;
    this.broadcastTimer = null;
  }
}
