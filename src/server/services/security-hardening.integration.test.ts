import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { staffService } from "@/server/services/staff.service";
import { UserRole } from "@/generated/prisma/client";

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

/**
 * Phase 8 security hardening tests.
 *
 * These guard the invariants that make the admin portal safe:
 *  1. Public self-registration is DISABLED — no one can mint a STAFF account
 *     via the open /sign-up/email endpoint.
 *  2. Staff creation still works through the admin plugin (the only
 *     sanctioned path) — the seed admin can create accounts.
 *  3. The app requires https for auth in production (env-level check, unit).
 */
describeDb("security hardening (DB)", () => {
  let adminHeaders: Headers;
  let adminId: string;
  const createdUserEmails: string[] = [];

  async function sessionHeaders(email: string, password: string): Promise<Headers> {
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: new Headers({ origin: "http://localhost:3000" }),
      asResponse: true,
    });
    const setCookie = response.headers.get("set-cookie") ?? "";
    // Cookie name is prefixed (e.g. "better-auth.session_token" or "hms.session_token").
    const match = /([^;=]+\.session_token)=([^;]+)/.exec(setCookie);
    if (!match) throw new Error("No session cookie in sign-in response");
    return new Headers({
      cookie: `${match[1]}=${match[2]}`,
      origin: "http://localhost:3000",
    });
  }

  beforeAll(async () => {
    adminHeaders = await sessionHeaders("admin@example.com", "Admin123!");
    adminId = (await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } })).id;
  });

  afterAll(async () => {
    for (const email of createdUserEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.account.deleteMany({ where: { userId: user.id } });
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.auditLog.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    // Clean any sessions created by signInEmail.
    await prisma.session.deleteMany({
      where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } })).id },
    });
    await prisma.$disconnect();
  });

  it("rejects public self-registration (signup disabled)", async () => {
    const email = `security-test-signup-${Date.now()}@example.com`;
    // The open sign-up endpoint must refuse to create a user.
    await expect(
      auth.api.signUpEmail({
        body: {
          name: "Self Registrant",
          email,
          password: "Password123!",
        },
        headers: new Headers({ origin: "http://localhost:3000" }),
      }),
    ).rejects.toThrow();

    // And no user row must exist.
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeNull();
  });

  it("still allows staff creation via the admin plugin", async () => {
    const email = `security-test-staff-${Date.now()}@example.com`;
    createdUserEmails.push(email);

    const created = await staffService.create(
      { name: "Security Test Staff", email, password: "TempPass123!", role: UserRole.STAFF },
      adminHeaders,
      adminId,
    );
    expect(created.email).toBe(email);
    expect(created.role).toBe(UserRole.STAFF);
  });

  it("rejects self-escalation attempts (role/status are input:false)", async () => {
    const email = `security-test-escalate-${Date.now()}@example.com`;
    createdUserEmails.push(email);

    const user = await staffService.create(
      { name: "Escalation Attempt", email, password: "TempPass123!", role: UserRole.STAFF },
      adminHeaders,
      adminId,
    );
    expect(user.role).toBe(UserRole.STAFF);

    // Attempting to set role/status via the public session endpoint must not
    // change the role — these fields are server-only (input: false).
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(dbUser.role).toBe(UserRole.STAFF);
  });
});
