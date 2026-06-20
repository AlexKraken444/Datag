import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) return NextResponse.json({ rows: [] });
  try {
    const rows = await prisma.leaderboard.findMany({
      orderBy: [{ wins: "desc" }, { hits: "desc" }],
      take: 50,
    });
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json({ rows: [] });
  }
}
