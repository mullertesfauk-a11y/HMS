import type { NextConfig } from "next";

/**
 * Security headers (Phase 8).
 *
 * CSP follows Next.js's recommended nonce-free configuration (see
 * node_modules/next/dist/docs/.../content-security-policy.md): we have no
 * third-party scripts, so `'unsafe-inline'` for scripts is an acceptable
 * trade-off that keeps static pages prerenderable. In development React
 * needs `'unsafe-eval'` for its debug stack traces.
 */
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://images.unsplash.com https://utfs.io;
    font-src 'self' data:;
    connect-src 'self' https://utfs.io${isDev ? " ws: http:" : ""};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader.replace(/\s{2,}/g, " ").trim() },
  // Sniffing protection.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking defense (kept alongside CSP frame-ancestors for older browsers).
  { key: "X-Frame-Options", value: "DENY" },
  // Only send the origin on cross-origin requests; never full paths.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable features the app doesn't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework (X-Powered-By: Next.js).
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // UploadThing-hosted images (menu item photos). `utfs.io` is already
      // allowed by the CSP img-src above.
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
