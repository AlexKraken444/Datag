// Datag — match simulation running in the HOST browser.
//
// Owns all authoritative state. Receives PlayerInput from peers, advances the
// simulation at 60Hz, emits snapshots / round events / match-end via a thin
// callback so the transport layer (PeerJS) stays decoupled.

import type {
  GameSnapshot,
  LighterState,
  MatchSummary,
  PlayerInput,
  Role,
  TagerState,
  Team,
} from "@/types/game";
import { HostLoop } from "./HostLoop";
import { PlayerSystem } from "@/game/sim/PlayerSystem";
import { LightSystem } from "@/game/sim/LightSystem";
import { ShadowSystem } from "@/game/sim/ShadowSystem";
import { CollisionSystem } from "@/game/sim/CollisionSystem";
import { ScoreSystem } from "@/game/sim/ScoreSystem";
import { RoundSystem } from "@/game/sim/RoundSystem";
import { LIGHTER, ROUND, TAGER } from "@/lib/constants";
import { UPGRADE_EFFECTS } from "@/lib/upgrades";

export interface Seat {
  id: string;        // peerId / clientId
  team: Team;
  role: Role;
  nickname: string;
  upgrades: string[];
}

export interface MatchEvents {
  onSnapshot: (snap: GameSnapshot) => void;
  onRoundEnd: (e: {
    scoredBy?: Team;
    bonus?: boolean;
    draw?: boolean;
    score: { A: number; B: number };
  }) => void;
  onMatchEnd: (summary: MatchSummary) => void;
}

export class HostMatch {
  private tagers: TagerState[] = [];
  private lighters: LighterState[] = [];
  private inputs = new Map<string, PlayerInput>();
  private hits = new Map<string, number>();
  /** Per-seat upgrade set (peerId -> Set<upgradeId>). */
  private upgrades = new Map<string, Set<string>>();
  /** Rising-edge bookkeeping: was the tager standing on enemy shadow last tick. */
  private wasOnShadow = new Map<string, boolean>();
  private postUntil = 0;
  private startedAt = Date.now();

  private playerSys = new PlayerSystem();
  private lightSys = new LightSystem();
  private shadowSys = new ShadowSystem();
  private collisionSys = new CollisionSystem();
  scoreSys = new ScoreSystem();
  roundSys = new RoundSystem();
  private loop: HostLoop;
  private tick = 0;

  constructor(
    private seats: Seat[],
    private events: MatchEvents,
  ) {
    for (const s of seats) {
      const seatUpgrades = new Set<string>(s.upgrades);
      this.upgrades.set(s.id, seatUpgrades);

      if (s.role === "TAGER") {
        const maxHp = seatUpgrades.has("EXTRA_LIFE")
          ? UPGRADE_EFFECTS.EXTRA_LIFE_HP
          : 1;
        this.tagers.push({
          id: s.id,
          team: s.team,
          pos: { x: 0, y: 0 },
          vel: { x: 0, y: 0 },
          stamina: TAGER.SPRINT_STAMINA_MAX,
          inStartZone: true,
          alive: true,
          hp: maxHp,
          maxHp,
        });
      } else {
        this.lighters.push({
          id: s.id,
          team: s.team,
          pos: { x: 0, y: 0 },
          aim: { x: 500, y: 500 },
          brightness:
            LIGHTER.BRIGHTNESS_MIN +
            (LIGHTER.BRIGHTNESS_MAX - LIGHTER.BRIGHTNESS_MIN) * 0.5,
        });
      }
      this.hits.set(s.id, 0);
    }

    this.loop = new HostLoop({
      onStep: (dt) => this.step(dt),
      onBroadcast: () => this.events.onSnapshot(this.snapshot()),
    });
  }

  start() {
    this.roundSys.respawn(this.tagers, this.lighters);
    this.roundSys.beginCountdown();
    this.wasOnShadow.clear();
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }

  input(peerId: string, payload: PlayerInput) {
    if (!this.seats.find((s) => s.id === peerId)) return;
    this.inputs.set(peerId, payload);
  }

  snapshot(): GameSnapshot {
    return {
      t: Date.now(),
      tick: this.tick,
      tagers: this.tagers,
      lighters: this.lighters,
      shadows: this.shadowSys.compute(this.tagers, this.lighters, this.upgrades),
      round: this.roundSys.state,
      score: this.scoreSys.state,
    };
  }

  private step(dtMs: number) {
    this.tick++;
    this.roundSys.tick(dtMs);

    const active = this.roundSys.state.phase === "PLAY";

    for (const t of this.tagers) {
      const seatIn = active ? this.inputs.get(t.id) ?? null : null;
      this.playerSys.step(
        t,
        seatIn,
        this.upgrades.get(t.id) ?? new Set(),
      );
    }
    for (const l of this.lighters) {
      this.lightSys.step(l, this.inputs.get(l.id) ?? null);
    }

    if (
      this.roundSys.state.phase === "COUNTDOWN" &&
      this.roundSys.state.countdownLeftMs <= 0
    ) {
      this.roundSys.enterPlay();
      this.wasOnShadow.clear();
    }
    if (
      this.roundSys.state.phase === "PLAY" &&
      this.roundSys.state.elapsedMs >= ROUND.MAX_DURATION_SEC * 1000
    ) {
      this.endRoundDraw();
    }

    if (active) {
      const shadows = this.shadowSys.compute(
        this.tagers,
        this.lighters,
        this.upgrades,
      );
      const events = this.collisionSys.detect(this.tagers, shadows);

      // events: { scoringTeam } — the team whose Tager IS standing on the
      // enemy shadow this tick. We collapse to per-attacker rising-edges so
      // a tager standing inside a shadow drains exactly one HP per entry.
      const scored: { team: Team; bonus: boolean }[] = [];
      for (const attacker of this.tagers) {
        const hitting = events.some((e) => e.scoringTeam === attacker.team);
        const was = this.wasOnShadow.get(attacker.id) ?? false;
        this.wasOnShadow.set(attacker.id, hitting);
        if (!hitting || was) continue;

        const enemyTeam: Team = attacker.team === "A" ? "B" : "A";
        const victim = this.tagers.find((t) => t.team === enemyTeam);
        if (!victim) continue;

        victim.hp -= 1;
        if (victim.hp <= 0) {
          const bonus = victim.inStartZone;
          scored.push({ team: attacker.team, bonus });
          this.hits.set(attacker.id, (this.hits.get(attacker.id) ?? 0) + 1);
        }
      }

      if (scored.length >= 2) {
        this.endRoundDraw();
      } else if (scored.length === 1) {
        const e = scored[0];
        this.scoreSys.award(e.team, e.bonus);
        this.endRoundScored(e.team, e.bonus);
      }
    }

    if (
      this.roundSys.state.phase === "POST" &&
      Date.now() >= this.postUntil
    ) {
      if (this.scoreSys.isOver()) {
        this.finish();
      } else {
        this.roundSys.respawn(this.tagers, this.lighters);
        this.roundSys.beginCountdown();
        this.wasOnShadow.clear();
      }
    }
  }

  private endRoundScored(team: Team, bonus: boolean) {
    this.roundSys.enterPost({ team, bonus });
    this.postUntil = Date.now() + ROUND.POST_ROUND_DELAY_MS;
    this.events.onRoundEnd({
      scoredBy: team,
      bonus,
      score: { A: this.scoreSys.state.A, B: this.scoreSys.state.B },
    });
  }

  private endRoundDraw() {
    this.roundSys.enterPost();
    this.postUntil = Date.now() + ROUND.POST_ROUND_DELAY_MS;
    this.events.onRoundEnd({
      draw: true,
      score: { A: this.scoreSys.state.A, B: this.scoreSys.state.B },
    });
  }

  private finish() {
    this.loop.stop();
    const winner: Team | "DRAW" =
      this.scoreSys.state.winner ??
      (this.scoreSys.state.A === this.scoreSys.state.B
        ? "DRAW"
        : this.scoreSys.state.A > this.scoreSys.state.B
          ? "A"
          : "B");

    const summary: MatchSummary = {
      id: `local_${this.startedAt}`,
      scoreA: this.scoreSys.state.A,
      scoreB: this.scoreSys.state.B,
      winner,
      finishedAt: Date.now(),
      players: this.seats.map((s) => {
        // coins = personal hits. Lighters don't score directly; we award their
        // share = same as their team's Tager hits (cooperative bonus).
        const tagerHits =
          this.hits.get(
            this.tagers.find((t) => t.team === s.team)?.id ?? "",
          ) ?? 0;
        const personalHits =
          s.role === "TAGER" ? this.hits.get(s.id) ?? 0 : tagerHits;
        return {
          id: s.id,
          nickname: s.nickname,
          team: s.team,
          role: s.role,
          hits: personalHits,
          coinsEarned: personalHits,
        };
      }),
    };

    this.events.onMatchEnd(summary);
  }
}
