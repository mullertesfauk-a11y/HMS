import "server-only";

import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";

/**
 * Better Auth server configuration.
 *
 * Security posture (Phase 8 hardening):
 * - Public self-registration is DISABLED (`disableSignUp`). Staff accounts are
 *   created exclusively through the admin plugin (`staffService.create`), so
 *   the open `/sign-up/email` endpoint would otherwise let anyone mint an
 *   account with the default STAFF role — full operational access.
 * - `role` and `status` are additional fields on the User model.
 *   `input: false` means clients can never set them (prevents
 *   self-escalation); only server-side calls (admin staff management) may
 *   assign roles.
 * - Rate limiting is enabled in production (built-in Better Auth limiter,
 *   keyed by client IP per path). Default rules are already strict for
 *   sign-in/sign-up; `customRules` tightens sign-in further.
 * - `trustedOrigins` restricts callback/origin URLs to the configured app
 *   origin (CSRF / open-redirect protection).
 * - Cookies are `Secure` + `SameSite=Lax` in production and namespaced with
 *   an app-specific prefix to avoid collisions on shared domains.
 * - A minimum password length is enforced server-side (staff creation UI
 *   enforces the same rule).
 *
 * NOTE: like the app-level `rateLimiter`, Better Auth's limiter uses an
 * in-memory store by default — correct for single instances, but swap in a
 * distributed store (or `secondaryStorage`) for multi-instance production.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    // No public signup — staff accounts are created via the admin plugin only.
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_APP_URL,
  ].filter((origin): origin is string => Boolean(origin)),
  rateLimit: {
    // Built-in limiter (per-IP, per-path). Production only — matches the
    // app-level rate limiter, which also defaults to in-memory storage.
    enabled: env.NODE_ENV === "production",
    window: 60,
    max: 30,
    customRules: {
      // Allow a few typing retries, but block brute-force attempts fast.
      "/sign-in/email": { window: 60, max: 10 },
    },
  },
  advanced: {
    cookiePrefix: "hms",
    // Secure cookies (and the __Secure- prefix) only over HTTPS.
    useSecureCookies: env.NODE_ENV === "production",
    // Best-effort client IP from the standard forwarded header.
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STAFF",
        input: false,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: "ACTIVE",
        input: false,
      },
    },
  },
  plugins: [
    admin({
      adminRoles: ["ADMIN"],
      defaultRole: "STAFF",
      // Map our UserRole enum values to the admin plugin's built-in access
      // control roles (defaults are lowercase "admin"/"user").
      roles: {
        ADMIN: adminAc,
        STAFF: userAc,
      },
    }),
  ],
});
