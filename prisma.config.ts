import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * - The datasource URL is read from DIRECT_URL because Prisma CLI operations
 *   (migrations, introspection) need a direct connection. Neon's pooled
 *   DATABASE_URL is used at runtime by the application (see src/lib/db/prisma.ts).
 * - The Prisma 7 CLI does NOT auto-load `.env`, hence the `dotenv/config` import.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
