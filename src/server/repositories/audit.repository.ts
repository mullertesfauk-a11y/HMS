import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { DbClient } from "@/server/repositories/types";

/**
 * Audit log persistence. Accepts a transaction client so audit entries can be
 * written atomically with the action they record. Never log passwords, tokens
 * or other secrets — `oldData`/`newData` are caller-controlled plain JSON.
 */
export const auditRepository = {
  log(params: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    reservationId?: string;
    oldData?: unknown;
    newData?: unknown;
    ipAddress?: string;
    userAgent?: string;
    db?: DbClient;
  }) {
    const db = params.db ?? prisma;
    return db.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        reservationId: params.reservationId,
        oldData: params.oldData === undefined ? undefined : (params.oldData as object),
        newData: params.newData === undefined ? undefined : (params.newData as object),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  },
};
