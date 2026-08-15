import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DbClient } from "@/server/repositories/types";

/**
 * Hotel persistence layer. MVP is single-hotel; the entity stays because the
 * domain is hotel software (multi-property comes later).
 */
export const hotelRepository = {
  findFirst(db?: DbClient) {
    const client = db ?? prisma;
    return client.hotel.findFirst({ orderBy: { createdAt: "asc" } });
  },

  findById(id: string, db?: DbClient) {
    const client = db ?? prisma;
    return client.hotel.findUnique({ where: { id } });
  },

  findBySlug(slug: string, db?: DbClient) {
    const client = db ?? prisma;
    return client.hotel.findUnique({ where: { slug } });
  },

  update(id: string, data: Prisma.HotelUncheckedUpdateInput, db?: DbClient) {
    const client = db ?? prisma;
    return client.hotel.update({ where: { id }, data });
  },
};
