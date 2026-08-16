import "server-only";
import { z } from "zod";

/**
 * Centralized environment configuration.
 *
 * All server-side environment variables are validated once at module load.
 * Never read `process.env` ad hoc elsewhere — import `env` from here.
 *
 * Client-visible public variables (NEXT_PUBLIC_*) are inlined by Next.js at
 * build time; only use them from client code via `process.env.NEXT_PUBLIC_*`.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Database (Neon)
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),

    // Authentication (Better Auth)
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),

    // Uploadthing (image uploads — optional in dev, required at runtime for uploads)
    UPLOADTHING_TOKEN: z.string().optional(),
    UPLOADTHING_APP_ID: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Production safety: the app URL must be known and served over HTTPS so
    // secure cookies, trusted origins, and OAuth callbacks are meaningful.
    // Loopback (localhost) is exempt so local production builds work.
    if (data.NODE_ENV === "production") {
      const appUrl = data.BETTER_AUTH_URL ?? data.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        ctx.addIssue({
          code: "custom",
          path: ["BETTER_AUTH_URL"],
          message:
            "BETTER_AUTH_URL (or NEXT_PUBLIC_APP_URL) is required in production — " +
            "secure cookies and trusted origins need a known origin",
        });
      } else {
        let host: string | null = null;
        try {
          host = new URL(appUrl).hostname;
        } catch {
          // URL parse already validated above; ignore.
        }
        const isLoopback =
          host === "localhost" || host === "127.0.0.1" || host === "::1";
        if (!isLoopback && !appUrl.startsWith("https://")) {
          ctx.addIssue({
            code: "custom",
            path: ["BETTER_AUTH_URL"],
            message: "BETTER_AUTH_URL must be an https:// URL in production",
          });
        }
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast at startup with a readable report instead of cryptic runtime errors.
  console.error(
    "❌ Invalid environment variables:\n" +
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  throw new Error("Invalid environment variables — check .env against .env.example");
}

export const env = parsed.data;
