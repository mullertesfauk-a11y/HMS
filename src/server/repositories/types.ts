import "server-only";

import { Prisma, PrismaClient } from "@/generated/prisma/client";

/**
 * A Prisma client that may be the global singleton OR the interactive
 * transaction client. Repository methods accept an optional `db` so services
 * can re-run availability checks inside `prisma.$transaction(...)`.
 */
export type DbClient = PrismaClient | Prisma.TransactionClient;
