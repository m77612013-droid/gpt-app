import type { NextConfig } from "next";

const nextConfig = {
  // TypeScript type errors will still fail the build (intentional)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Images — Vercel handles optimization natively
  // Do NOT use output:'export' — the app uses proxy/SSR cookies

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Fully permissive CSP for the CPAGrip wall page so all ad scripts load
        source: "/api/cpagrip-wall",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self'",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        // All routes EXCEPT cpagrip-wall — apply normal restrictive CSP
        source: "/((?!api/cpagrip-wall).*)",
        headers: [
          {
            // Allow CPAGrip offerwall iframe from singingfiles.com
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://singingfiles.com https://*.cpagrip.com",
              "frame-src 'self' https://singingfiles.com https://*.cpagrip.com https://*.monlix.com https://cpalead.com https://*.adgaterewards.com https://wall.lootably.com https://*.adscendmedia.com",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://singingfiles.com https://*.cpagrip.com",
            ].join("; "),
          },
          // Allow CPAGrip to embed in our page (X-Frame-Options)
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
