// Datag — best-effort match persistence. Called by the HOST browser after a
// match ends; never trusted for authoritative scoring (host could lie). Used
// only to populate leaderboard/history when a DB is configured.

import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import type { MatchSummary } from "@/types/game";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Body {
  roomCode: string;
  summary: MatchSummary;
}

export async function POST(req: Request) {
  if (!prisma) return NextResponse.json({ ok: true, persisted: false });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { roomCode, summary } = body || ({} as Body);
  if (!roomCode || !summary || !Array.isArray(summary.players)) {
    return NextResponse.json({ ok: false, error: "bad payload" }, { status: 400 });
  }

  try {
    const match = await prisma.match.create({
      data: {
        roomCode: String(roomCode).slice(0, 16),
        startedAt: new Date(),
        finishedAt: new Date(summary.finishedAt || Date.now()),
        scoreA: summary.scoreA | 0,
        scoreB: summary.scoreB | 0,
        winner: String(summary.winner).slice(0, 8),
        players: {
          create: summary.players.map((p) => ({
            nickname: String(p.nickname).slice(0, 16),
            team: p.team === "A" ? "A" : "B",
            role: p.role === "LIGHTER" ? "LIGHTER" : "TAGER",
            hits: p.hits | 0,
          })),
        },
      },
    });

    for (const p of summary.players) {
      const isWinner = summary.winner !== "DRAW" && p.team === summary.winner;
      await prisma.leaderboard.upsert({
        where: { nickname: p.nickname },
        update: {
          hits: { increment: p.hits | 0 },
          matches: { increment: 1 },
          wins: { increment: isWinner ? 1 : 0 },
          losses: {
            increment: !isWinner && summary.winner !== "DRAW" ? 1 : 0,
          },
        },
        create: {
          nickname: String(p.nickname).slice(0, 16),
          hits: p.hits | 0,
          matches: 1,
          wins: isWinner ? 1 : 0,
          losses: !isWinner && summary.winner !== "DRAW" ? 1 : 0,
        },
      });
    }

    return NextResponse.json({ ok: true, persisted: true, id: match.id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, persisted: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
