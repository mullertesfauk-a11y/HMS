import { describe, expect, it } from "vitest";

import { UserRole } from "@/generated/prisma/client";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

const { ADMIN, STAFF } = UserRole;
const allPermissions = Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[];

describe("permission matrix", () => {
  it("ADMIN has every permission", () => {
    for (const permission of allPermissions) {
      expect(hasPermission(ADMIN, permission), permission).toBe(true);
    }
  });

  it("STAFF has operational permissions", () => {
    for (const permission of [
      "dashboard.view",
      "reservations.read",
      "reservations.create",
      "reservations.update",
      "reservations.cancel",
      "reservations.confirm",
      "reservations.checkin",
      "reservations.checkout",
      "rooms.read",
      "rooms.update",
      "roomTypes.read",
      "guests.read",
      "guests.create",
      "guests.update",
    ] as const) {
      expect(hasPermission(STAFF, permission), permission).toBe(true);
    }
  });

  it("STAFF cannot manage rooms or room types (destructive access)", () => {
    for (const permission of [
      "rooms.create",
      "rooms.delete",
      "roomTypes.create",
      "roomTypes.update",
      "roomTypes.delete",
    ] as const) {
      expect(hasPermission(STAFF, permission), permission).toBe(false);
    }
  });

  it("STAFF cannot access staff management, settings, or role assignment", () => {
    for (const permission of [
      "staff.read",
      "staff.create",
      "staff.update",
      "staff.disable",
      "settings.read",
      "settings.update",
    ] as const) {
      expect(hasPermission(STAFF, permission), permission).toBe(false);
    }
  });

  it("every permission grants at least one role (no dead entries)", () => {
    for (const permission of allPermissions) {
      expect(PERMISSIONS[permission].length, permission).toBeGreaterThan(0);
    }
  });
});
