import "server-only";

import { z } from "zod";

import type { PaginationMeta } from "@/lib/api/response";

/**
 * Reusable pagination + sorting parser.
 *
 * Every list endpoint accepts:
 *   ?page=1&pageSize=25&sortBy=checkIn&sortOrder=asc
 *
 * Parse raw query params with `parsePaginationQuery`, then use the computed
 * `skip`/`take` with Prisma and build meta with `buildPaginationMeta`.
 */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().min(1).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface ParsedPagination extends PaginationQuery {
  skip: number;
  take: number;
}

/**
 * Parse and validate pagination params from a URLSearchParams / plain object.
 * Falls back to defaults when values are missing or invalid.
 */
export function parsePaginationQuery(
  query: Record<string, string | string[] | undefined>,
): ParsedPagination {
  const raw: Record<string, string | undefined> = {};
  for (const key of ["page", "pageSize", "sortBy", "sortOrder"]) {
    const value = query[key];
    raw[key] = Array.isArray(value) ? value[0] : value;
  }

  const result = paginationQuerySchema.safeParse(raw);
  if (!result.success) {
    return { page: 1, pageSize: 25, sortBy: undefined, sortOrder: "asc", skip: 0, take: 25 };
  }

  const { page, pageSize, sortBy, sortOrder } = result.data;
  return { page, pageSize, sortBy, sortOrder, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}
