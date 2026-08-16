import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

/**
 * Centralized authorization.
 *
 * Only two roles exist today (ADMIN, STAFF), but the system is permission-
 * based so new roles can be added to the map without touching route handlers
 * or services. Never spread role checks through the app — use the helpers
 * below (`requirePermission`, `requireRole`, ...).
 */

export type Role = UserRole;

export const PERMISSIONS = {
  "dashboard.view": [UserRole.ADMIN, UserRole.STAFF],

  "reservations.read": [UserRole.ADMIN, UserRole.STAFF],
  "reservations.create": [UserRole.ADMIN, UserRole.STAFF],
  "reservations.update": [UserRole.ADMIN, UserRole.STAFF],
  "reservations.cancel": [UserRole.ADMIN, UserRole.STAFF],
  "reservations.confirm": [UserRole.ADMIN, UserRole.STAFF],
  "reservations.checkin": [UserRole.ADMIN, UserRole.STAFF],
  "reservations.checkout": [UserRole.ADMIN, UserRole.STAFF],

  "rooms.read": [UserRole.ADMIN, UserRole.STAFF],
  "rooms.create": [UserRole.ADMIN],
  "rooms.update": [UserRole.ADMIN, UserRole.STAFF],
  "rooms.delete": [UserRole.ADMIN],

  "roomTypes.read": [UserRole.ADMIN, UserRole.STAFF],
  "roomTypes.create": [UserRole.ADMIN],
  "roomTypes.update": [UserRole.ADMIN],
  "roomTypes.delete": [UserRole.ADMIN],

  "guests.read": [UserRole.ADMIN, UserRole.STAFF],
  "guests.create": [UserRole.ADMIN, UserRole.STAFF],
  "guests.update": [UserRole.ADMIN, UserRole.STAFF],

  // Staff management is ADMIN-only.
  "staff.read": [UserRole.ADMIN],
  "staff.create": [UserRole.ADMIN],
  "staff.update": [UserRole.ADMIN],
  "staff.disable": [UserRole.ADMIN],

  "orders.read": [UserRole.ADMIN, UserRole.STAFF],
  "orders.update": [UserRole.ADMIN, UserRole.STAFF],

  "menu.read": [UserRole.ADMIN, UserRole.STAFF],
  "menu.create": [UserRole.ADMIN],
  "menu.update": [UserRole.ADMIN],
  "menu.delete": [UserRole.ADMIN],

  "settings.read": [UserRole.ADMIN],
  "settings.update": [UserRole.ADMIN],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
}

/** Resolve the current session user, or throw UnauthorizedError. */
export async function requireAuth(): Promise<AuthUser> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  const user = session.user as unknown as AuthUser;
  if (user.status !== "ACTIVE") {
    throw new ForbiddenError("This account is disabled");
  }
  return user;
}

/** Require any of the given roles. */
export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}

/** Require a specific permission. */
export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    throw new ForbiddenError();
  }
  return user;
}

/**
 * Permission check for PAGES: on failure, redirect instead of throwing so the
 * user lands somewhere useful (unauthenticated → login, wrong role → their
 * dashboard). The API routes keep using `requirePermission` (errors → 401/403).
 */
export async function requirePermissionPage(permission: Permission): Promise<AuthUser> {
  try {
    return await requirePermission(permission);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/admin/login");
    }
    if (error instanceof ForbiddenError) {
      redirect("/admin/dashboard");
    }
    throw error;
  }
}
