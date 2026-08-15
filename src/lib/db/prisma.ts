import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

import { env } from "@/lib/env";

/**
 * Prisma client singleton for server-side use.
 *
 * Uses the Neon driver adapter (WebSocket pool) so the app runs on serverless
 * runtimes and never opens a raw TCP connection. The pooled DATABASE_URL is
 * used here; migrations use DIRECT_URL via prisma.config.ts.
 *
 * The client is memoized on `globalThis` to avoid exhausting connection pools
 * during hot reloads in development.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
