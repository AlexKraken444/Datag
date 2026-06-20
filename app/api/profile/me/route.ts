// Datag — read / write the authenticated user's profile.
// GET  -> returns the profile (or { profile: null } for unauthenticated).
// POST -> overwrites coins, upgrades, matchesPlayed. Server-side sanity:
//         coins >= 0, upgrades subset of known catalogue, no duplicates.
// Nickname changes go through PATCH so we can check uniqueness.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { UPGRADES } from "@/lib/upgrades";
import { nicknameValid } from "@/lib/code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !prisma)
    return NextResponse.json({ profile: null });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      nickname: true,
      coins: true,
      upgrades: true,
      matchesPlayed: true,
    },
  });
  return NextResponse.json({ profile: user ?? null });
}

const writeSchema = z.object({
  coins: z.number().int().min(0).max(1_000_000),
  upgrades: z.array(z.string().max(32)).max(32),
  matchesPlayed: z.number().int().min(0).max(1_000_000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !prisma)
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: "bad payload" },
      { status: 400 },
    );

  // sanitize upgrades — drop unknown ids, dedup
  const sane = Array.from(
    new Set(parsed.data.upgrades.filter((u) => u in UPGRADES)),
  );

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      coins: parsed.data.coins,
      upgrades: sane,
      matchesPlayed: parsed.data.matchesPlayed,
    },
  });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  nickname: z.string().min(2).max(16),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !prisma)
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || !nicknameValid(parsed.data.nickname))
    return NextResponse.json(
      { ok: false, error: "Некорректный ник" },
      { status: 400 },
    );
  const taken = await prisma.user.findFirst({
    where: { nickname: parsed.data.nickname, NOT: { id: session.user.id } },
    select: { id: true },
  });
  if (taken)
    return NextResponse.json(
      { ok: false, error: "Этот ник уже занят" },
      { status: 409 },
    );
  await prisma.user.update({
    where: { id: session.user.id },
    data: { nickname: parsed.data.nickname },
  });
  return NextResponse.json({ ok: true });
}
