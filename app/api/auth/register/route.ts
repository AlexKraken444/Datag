// Datak — email/password registration.
// Validates input, checks uniqueness, stores hashed password.

import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { nicknameValid } from "@/lib/code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(120),
  nickname: z.string().min(2).max(16),
});

export async function POST(req: Request) {
  if (!prisma) {
    return NextResponse.json(
      { ok: false, error: "База данных не настроена (нет DATABASE_URL)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный запрос" },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Проверь email/пароль (≥ 8 символов) и ник (2–16)",
      },
      { status: 400 },
    );
  }
  if (!nicknameValid(parsed.data.nickname)) {
    return NextResponse.json(
      { ok: false, error: "Ник: 2–16 букв/цифр/_/-" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const nickname = parsed.data.nickname;

  try {
    const dupe = await prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }] },
      select: { email: true, nickname: true },
    });
    if (dupe) {
      const which = dupe.email === email ? "email" : "ник";
      return NextResponse.json(
        { ok: false, error: `Такой ${which} уже занят` },
        { status: 409 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 10);
    await prisma.user.create({
      data: { email, passwordHash, nickname },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
