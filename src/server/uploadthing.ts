import { headers } from "next/headers";
import { createUploadthing, UploadThingError } from "uploadthing/server";
import type { FileRouter } from "uploadthing/server";

import { auth } from "@/lib/auth";
import type { Role } from "@/lib/permissions";

const f = createUploadthing();

/**
 * Uploadthing file router.
 *
 * Auth middleware verifies the Better Auth session from the incoming Request
 * — only authenticated admin/staff may upload. Session resolution goes through
 * `auth.api.getSession` (same path as the rest of the app) because the browser
 * cookie holds the *signed* session token while the DB stores the raw token;
 * a manual `prisma.session.findUnique` on the cookie value can never match.
 */
export const uploadRouter = {
  menuImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      let requestHeaders: Headers;
      try {
        requestHeaders = await headers();
      } catch {
        requestHeaders = req.headers;
      }

      // Ensure cookie header from req is present if not in next/headers
      if (!requestHeaders.get("cookie") && req.headers.get("cookie")) {
        const merged = new Headers(requestHeaders);
        merged.set("cookie", req.headers.get("cookie")!);
        requestHeaders = merged;
      }

      const session = await auth.api.getSession({ headers: requestHeaders });

      if (!session?.user) {
        throw new UploadThingError("Unauthorized — no valid session");
      }

      const user = session.user as unknown as { id: string; role: Role; status: string };

      if (user.status !== "ACTIVE") {
        throw new UploadThingError("Forbidden — account disabled");
      }

      return { userId: user.id, role: user.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        `Menu image uploaded by ${metadata.userId} (${metadata.role}): ${file.ufsUrl}`,
      );
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
