import "server-only";

import { Prisma, UserRole, UserStatus } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors";
import { auditRepository } from "@/server/repositories/audit.repository";
import type { StaffCreateInput, StaffUpdateInput } from "@/lib/validation/staff";

/**
 * Staff service (ADMIN only — enforced by permissions in the route layer and
 * by the Better Auth admin plugin itself).
 *
 * Account creation/updates go through the Better Auth admin plugin so
 * password hashing and user lifecycle stay entirely with Better Auth.
 * Sessions are never exposed; plaintext passwords never exist.
 */

/** Staff member as seen by the admin UI (safe fields only). */
export interface StaffView {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  lastActivityAt: Date | null;
}

export class StaffService {
  async list(params: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    page: number;
    pageSize: number;
  }): Promise<{ items: StaffView[]; total: number; page: number; pageSize: number }> {
    const where: Prisma.UserWhereInput = {};
    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          sessions: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const items: StaffView[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastActivityAt: user.sessions[0]?.createdAt ?? null,
    }));

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async get(id: string): Promise<StaffView> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
      },
    });
    if (!user) throw new NotFoundError("Staff member not found");
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastActivityAt: user.sessions[0]?.createdAt ?? null,
    };
  }

  /**
   * Create a staff account via the Better Auth admin plugin. `headers` must
   * carry an ADMIN session (the admin plugin enforces it).
   */
  async create(input: StaffCreateInput, headers: Headers, actorId?: string) {
    const { user } = await auth.api.createUser({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
      },
      headers,
    });
    await auditRepository.log({
      action: "staff.created",
      entity: "user",
      entityId: user.id,
      userId: actorId,
      newData: { name: user.name, email: user.email, role: input.role },
    });
    return user;
  }

  /** Update name / role / status. */
  async update(id: string, input: StaffUpdateInput, headers: Headers) {
    await this.get(id);

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.role !== undefined) data.role = input.role;
    if (input.status !== undefined) data.status = input.status;

    if (Object.keys(data).length > 0) {
      await auth.api.adminUpdateUser({
        body: { userId: id, data },
        headers,
      });
    }

    await auditRepository.log({
      action: "staff.updated",
      entity: "user",
      entityId: id,
      newData: data,
    });

    return this.get(id);
  }

  async disable(id: string, headers: Headers) {
    await this.get(id);
    await auth.api.adminUpdateUser({
      body: { userId: id, data: { status: UserStatus.DISABLED } },
      headers,
    });
    await auditRepository.log({
      action: "staff.disabled",
      entity: "user",
      entityId: id,
      newData: { status: UserStatus.DISABLED },
    });
    return this.get(id);
  }
}

export const staffService = new StaffService();
