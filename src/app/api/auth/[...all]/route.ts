import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/**
 * Better Auth catch-all handler. All auth endpoints live under /api/auth/*:
 * sign-in, sign-up, sign-out, session, etc.
 */
export const { GET, POST } = toNextJsHandler(auth);
