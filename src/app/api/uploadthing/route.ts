import { createRouteHandler } from "uploadthing/next";

import { env } from "@/lib/env";
import { uploadRouter } from "@/server/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    token: env.UPLOADTHING_TOKEN,
  },
});

