// Datag — orchestrates a single match (best to 12). Composes systems, owns
// authoritative state, emits snapshots and lifecycle events.

import type { Server as IOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket";
import type {
  GameSnapshot,
  LighterState,
  MatchSummary,
  PlayerInput,
  Role,
  TagerState,
  Team,
} from "@/types/game";
import { GameLoop } from "./GameLoop";
import { PlayerSystem } from "./systems/PlayerSystem";
import { LightSystem } from "./systems/LightSystem";
import { ShadowSystem } from "./systems/ShadowSystem";
import { CollisionSystem } from "./systems/CollisionSystem";
import { ScoreSystem } from "./systems/ScoreSystem";
import { RoundSystem } from "./systems/RoundSystem";
import { LIGHTER, ROUND, TAGER } from "@/lib/constants";
import { prisma } from "../db/prisma";

interface Seat {
  id: string;
  team: Team;
  role: Role;
  nickname: string;
}

export class Match {
  // entities
  private tagers: TagerState[] = [];
  private lighters: LighterState[] = [];
  // playerId -> latest input
  private inputs = new Map<string, PlayerInput>();
  // bookkeeping
  private hits = new Map<string, number>(); // socketId -> hits
  private postUntil = 0;
  private startedAt = Date.now();
  private dbMatchId: string | null = null;

  private playerSys = new PlayerSystem();
  private lightSys = new LightSystem();
  private shadowSys = new ShadowSystem();
  private collisionSys = new CollisionSystem();
  scoreSys = new ScoreSystem();
  roundSys = new RoundSystem();
  private loop: GameLoop;
  private tick = 0;

  constructor(
    private io: IOServer<ClientToServerEvents, ServerToClientEvents>,
    private roomCode: string,
    private seats: Seat[],
    private onEnd: (summary: MatchSummary) => void,
  ) {
    for (const s of seats) {
      if (s.role === "TAGER") {
        this.tagers.push({
          id: s.id,
          team: s.team,
          pos: { x: 0, y: 0 },
          vel: { x: 0, y: 0 },
          stamina: TAGER.SPRINT_STAMINA_MAX,
          inStartZone: true,
          alive: true,
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

    this.loop = new GameLoop({
      onStep: (dt) => this.step(dt),
      onBroadcast: () => this.broadcast(),
    });
  }

  // ---------- lifecycle ----------

  async start() {
    this.roundSys.respawn(this.tagers, this.lighters);
    this.roundSys.beginCountdown();
    this.loop.start();
    if (prisma) {
      try {
        const m = await prisma.match.create({
          data: {
            roomCode: this.roomCode,
            players: {
              create: this.seats.map((s) => ({
                nickname: s.nickname,
                team: s.team,
                role: s.role,
              })),
            },
          },
        });
        this.dbMatchId = m.id;
      } catch {
        /* DB optional during dev */
      }
    }
  }

  stop() {
    this.loop.stop();
  }

  input(socketId: string, payload: PlayerInput) {
    // basic sanitization — do not trust client; clamp at simulation step
    if (!this.seats.find((s) => s.id === socketId)) return;
    this.inputs.set(socketId, payload);
  }

  rejoin(socketId: string) {
    // remap by nickname-based seat already done in Room; just send a snapshot
    this.io.to(socketId).emit("match:snapshot", this.snapshot());
  }

  // ---------- core tick ----------

  private step(dtMs: number) {
    this.tick++;
    this.roundSys.tick(dtMs);

    // freeze movement during COUNTDOWN / POST
    const active = this.roundSys.state.phase === "PLAY";

    for (const t of this.tagers) {
      const seatIn = active
        ? this.inputs.get(t.id) ?? null
        : null;
      this.playerSys.step(t, seatIn);
    }
    for (const l of this.lighters) {
      // Lighter can always aim — even during COUNTDOWN — to prepare. We allow it.
      this.lightSys.step(l, this.inputs.get(l.id) ?? null);
    }

    // phase transitions
    if (
      this.roundSys.state.phase === "COUNTDOWN" &&
      this.roundSys.state.countdownLeftMs <= 0
    ) {
      this.roundSys.enterPlay();
    }
    if (
      this.roundSys.state.phase === "PLAY" &&
      this.roundSys.state.elapsedMs >= ROUND.MAX_DURATION_SEC * 1000
    ) {
      // safety: no-hit timeout = draw, fresh round
      this.endRoundDraw();
    }

    if (active) {
      const shadows = this.shadowSys.compute(this.tagers, this.lighters);
      const events = this.collisionSys.detect(this.tagers, shadows);

      if (events.length >= 2) {
        // both teams hit on the same tick => draw
        this.endRoundDraw();
      } else if (events.length === 1) {
        const e = events[0];
        const bonus = e.victimWasInStartZone;
        this.scoreSys.award(e.scoringTeam, bonus);
        // count hits per scoring player (Tager)
        const tager = this.tagers.find((t) => t.team === e.scoringTeam);
        if (tager) this.hits.set(tager.id, (this.hits.get(tager.id) ?? 0) + 1);
        this.endRoundScored(e.scoringTeam, bonus);
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
      }
    }
  }

  private endRoundScored(team: Team, bonus: boolean) {
    this.roundSys.enterPost({ team, bonus });
    this.postUntil = Date.now() + ROUND.POST_ROUND_DELAY_MS;
    this.io.to(this.roomCode).emit("match:round_end", {
      scoredBy: team,
      bonus,
      score: { A: this.scoreSys.state.A, B: this.scoreSys.state.B },
    });
  }

  private endRoundDraw() {
    this.roundSys.enterPost();
    this.postUntil = Date.now() + ROUND.POST_ROUND_DELAY_MS;
    this.io.to(this.roomCode).emit("match:round_end", {
      draw: true,
      score: { A: this.scoreSys.state.A, B: this.scoreSys.state.B },
    });
  }

  private snapshot(): GameSnapshot {
    return {
      t: Date.now(),
      tick: this.tick,
      tagers: this.tagers,
      lighters: this.lighters,
      shadows: this.shadowSys.compute(this.tagers, this.lighters),
      round: this.roundSys.state,
      score: this.scoreSys.state,
    };
  }

  private broadcast() {
    this.io.to(this.roomCode).emit("match:snapshot", this.snapshot());
  }

  private async finish() {
    this.loop.stop();
    const winner: Team | "DRAW" =
      this.scoreSys.state.winner ??
      (this.scoreSys.state.A === this.scoreSys.state.B
        ? "DRAW"
        : this.scoreSys.state.A > this.scoreSys.state.B
          ? "A"
          : "B");

    const summary: MatchSummary = {
      id: this.dbMatchId ?? `local_${this.startedAt}`,
      scoreA: this.scoreSys.state.A,
      scoreB: this.scoreSys.state.B,
      winner,
      finishedAt: Date.now(),
      players: this.seats.map((s) => ({
        nickname: s.nickname,
        team: s.team,
        role: s.role,
        hits: this.hits.get(s.id) ?? 0,
      })),
    };

    if (prisma && this.dbMatchId) {
      try {
        await prisma.match.update({
          where: { id: this.dbMatchId },
          data: {
            finishedAt: new Date(),
            scoreA: summary.scoreA,
            scoreB: summary.scoreB,
            winner,
          },
        });
        // upsert leaderboard
        for (const p of summary.players) {
          const isWinner = winner !== "DRAW" && p.team === winner;
          await prisma.leaderboard.upsert({
            where: { nickname: p.nickname },
            update: {
              hits: { increment: p.hits },
              matches: { increment: 1 },
              wins: { increment: isWinner ? 1 : 0 },
              losses: { increment: !isWinner && winner !== "DRAW" ? 1 : 0 },
            },
            create: {
              nickname: p.nickname,
              hits: p.hits,
              matches: 1,
              wins: isWinner ? 1 : 0,
              losses: !isWinner && winner !== "DRAW" ? 1 : 0,
            },
          });
        }
      } catch {
        /* ignore in dev */
      }
    }

    this.onEnd(summary);
  }
}
