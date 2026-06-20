// Datag — round phases + spawn reset.

import { ROUND, TAGER, LIGHTER } from "@/lib/constants";
import type {
  LighterState,
  RoundState,
  TagerState,
  Team,
} from "@/types/game";
import { LighterZones, TagerZones } from "@/lib/zones";

export class RoundSystem {
  state: RoundState = {
    index: 0,
    phase: "IDLE",
    countdownLeftMs: 0,
    elapsedMs: 0,
  };

  beginCountdown() {
    this.state.index += 1;
    this.state.phase = "COUNTDOWN";
    this.state.countdownLeftMs = ROUND.COUNTDOWN_SEC * 1000;
    this.state.elapsedMs = 0;
    this.state.lastHit = undefined;
  }

  enterPlay() {
    this.state.phase = "PLAY";
    this.state.countdownLeftMs = 0;
    this.state.elapsedMs = 0;
  }

  enterPost(hit?: { team: Team; bonus: boolean }) {
    this.state.phase = "POST";
    if (hit) this.state.lastHit = { ...hit, ts: Date.now() };
  }

  tick(dtMs: number) {
    if (this.state.phase === "COUNTDOWN") {
      this.state.countdownLeftMs -= dtMs;
    } else if (this.state.phase === "PLAY") {
      this.state.elapsedMs += dtMs;
    }
  }

  respawn(tagers: TagerState[], lighters: LighterState[]) {
    for (const t of tagers) {
      const s = TagerZones[t.team].spawn;
      t.pos = { x: s.x, y: s.y };
      t.vel = { x: 0, y: 0 };
      t.stamina = TAGER.SPRINT_STAMINA_MAX;
      t.inStartZone = true;
      t.alive = true;
    }
    for (const l of lighters) {
      const s = LighterZones[l.team].spawn;
      l.pos = { x: s.x, y: s.y };
      // aim toward center by default
      l.aim = { x: 500, y: 500 };
      l.brightness = LIGHTER.BRIGHTNESS_MIN +
        (LIGHTER.BRIGHTNESS_MAX - LIGHTER.BRIGHTNESS_MIN) * 0.5;
    }
  }

  reset() {
    this.state = {
      index: 0,
      phase: "IDLE",
      countdownLeftMs: 0,
      elapsedMs: 0,
    };
  }
}
