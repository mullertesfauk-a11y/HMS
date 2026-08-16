import { createUploadthing, UploadThingError } from "uploadthing/server";
import type { FileRouter } from "uploadthing/server";

import { prisma } from "@/lib/db/prisma";

const f = createUploadthing();

/**
 * Uploadthing file router.
 *
 * Auth middleware verifies the Better Auth session from cookies on the
 * incoming Request — only authenticated admin/staff may upload.
 */
export const uploadRouter = {
  menuImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Verify Better Auth session from cookies
      const cookieHeader = req.headers.get("cookie") ?? "";
      const sessionToken = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("hms.session="))
        ?.split("=")[1];

      if (!sessionToken) {
        throw new UploadThingError("Unauthorized — no session");
      }

      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UploadThingError("Unauthorized — session expired");
      }

      if (session.user.status !== "ACTIVE") {
        throw new UploadThingError("Forbidden — account disabled");
      }

      return { userId: session.user.id, role: session.user.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        `Menu image uploaded by ${metadata.userId} (${metadata.role}): ${file.ufsUrl}`,
      );
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
