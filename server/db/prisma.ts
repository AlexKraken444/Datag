// Datak — single Prisma client instance. Tolerant to missing DB during dev:
// if no Postgres URL is set we expose a null-shim that swallows persistence.
//
// Accepts EITHER:
//   - DATABASE_URL                 (classic / local dev)
//   - POSTGRES_PRISMA_URL          (auto-injected by Vercel Postgres / Neon)
//
// The URL is passed explicitly via PrismaClient's `datasourceUrl` so we don't
// require users to manually copy POSTGRES_PRISMA_URL into DATABASE_URL on Vercel.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __datakPrisma: PrismaClient | undefined;
}

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  "";

let prisma: PrismaClient | null = null;

if (url) {
  prisma =
    global.__datakPrisma ??
    new PrismaClient({
      log: ["warn", "error"],
      datasourceUrl: url,
    });
  if (process.env.NODE_ENV !== "production") global.__datakPrisma = prisma;
}

export { prisma };
