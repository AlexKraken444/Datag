// Datak — single Prisma client instance. Tolerant to missing DB during dev:
// if DATABASE_URL is not set we expose a null-shim that swallows persistence.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __datakPrisma: PrismaClient | undefined;
}

let prisma: PrismaClient | null = null;

if (process.env.DATABASE_URL) {
  prisma =
    global.__datakPrisma ??
    new PrismaClient({ log: ["warn", "error"] });
  if (process.env.NODE_ENV !== "production") global.__datakPrisma = prisma;
}

export { prisma };
