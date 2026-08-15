import path from "node:path";

import "dotenv/config";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // The DB integration suites share one database; run files sequentially so
    // they never see each other's in-flight test data.
    fileParallelism: false,
    // Neon round-trips over WebSocket are slow (~1-4s per query batch), so the
    // default 5s per-test timeout is far too small for DB integration suites.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      // Next's `server-only` package throws outside the react-server export
      // condition; unit tests run in plain Node, so resolve it to a stub.
      "server-only": path.resolve(process.cwd(), "test/server-only-stub.ts"),
    },
  },
});
