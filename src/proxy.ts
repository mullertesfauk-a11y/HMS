import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: import("next/server").NextRequest) {
  // Skip locale handling for API routes, admin, Next.js internals, and static files
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return;
  }

  return handleI18nRouting(request);
}

export const config = {
  // Only run proxy on website routes (exclude admin, api, and static assets)
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
