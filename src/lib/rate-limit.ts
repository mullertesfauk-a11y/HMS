import "server-only";

import { RateLimitError } from "@/lib/errors";

/**
 * Rate limiting abstraction.
 *
 * The interface is intentionally small so the implementation can be swapped
 * for a distributed store (Upstash Redis, Vercel KV, etc.) without touching
 * route handlers.
 *
 * NOTE: `InMemoryRateLimiter` is a development-grade, per-instance limiter —
 * it is NOT correct for production (multiple instances / cold starts each get
 * their own budget). Swap the `rateLimiter` export for a distributed
 * implementation in production; see README "Rate limiting".
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** ISO timestamp after which the current window resets. */
  resetAt: Date;
}

export interface RateLimiter {
  consume(key: string, opts?: { limit?: number; windowMs?: number }): Promise<RateLimitResult>;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private windows = new Map<string, WindowEntry>();

  async consume(
    key: string,
    opts: { limit?: number; windowMs?: number } = {},
  ): Promise<RateLimitResult> {
    const limit = opts.limit ?? 60;
    const windowMs = opts.windowMs ?? 60_000;
    const now = Date.now();

    const entry = this.windows.get(key);
    if (!entry || entry.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: limit - 1, resetAt: new Date(now + windowMs) };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0, resetAt: new Date(entry.resetAt) };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count, resetAt: new Date(entry.resetAt) };
  }
}

/** Default limiter — replace with a distributed implementation in production. */
export const rateLimiter: RateLimiter = new InMemoryRateLimiter();

/**
 * Helper for route handlers: consumes a rate limit and throws RateLimitError
 * when exceeded. Key should include the identifier (e.g. IP) + route/action.
 */
export async function enforceRateLimit(
  key: string,
  opts?: { limit?: number; windowMs?: number },
): Promise<void> {
  const result = await rateLimiter.consume(key, opts);
  if (!result.success) {
    throw new RateLimitError();
  }
}
