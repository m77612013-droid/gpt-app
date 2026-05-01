import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cpagrip-proxy?id=<OFFERWALL_ID>&u=<USER_ID>
 *
 * Acts as a reverse-proxy for the CPAGrip offerwall page.
 * CPAGrip sends "X-Frame-Options: SAMEORIGIN" which blocks direct iframe
 * embedding on external domains. By fetching the page server-side and
 * re-serving it through our own domain, the browser sees janarewards.xyz
 * as the origin — and the iframe works perfectly.
 *
 * Security:
 *  - Only proxies requests to singingfiles.com (whitelist)
 *  - Strips X-Frame-Options and CSP headers from the upstream response
 *  - Rewrites absolute URLs in the HTML so assets still load correctly
 */

const UPSTREAM_BASE = "https://singingfiles.com";
const ALLOWED_PATH  = "/show.php";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get("id");
  const u  = searchParams.get("u");

  if (!id || !u) {
    return new NextResponse("Missing id or u parameter", { status: 400 });
  }

  // Build the upstream URL
  const upstream = new URL(ALLOWED_PATH, UPSTREAM_BASE);
  upstream.searchParams.set("l", "0");
  upstream.searchParams.set("id", id);
  upstream.searchParams.set("u", u);

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream.toString(), {
      headers: {
        // Forward a realistic browser user-agent so CPAGrip serves full content
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://janarewards.xyz/",
      },
      // Don't follow redirects blindly — handle manually if needed
      redirect: "follow",
      // 10-second timeout
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[cpagrip-proxy] fetch error:", err);
    return new NextResponse("Failed to reach CPAGrip", { status: 502 });
  }

  const contentType = upstreamRes.headers.get("content-type") ?? "text/html";
  let body = await upstreamRes.text();

  // ── Rewrite absolute & relative asset URLs so they resolve correctly ──────
  // Replace //singingfiles.com and http(s)://singingfiles.com with absolute refs
  body = body.replace(
    /(src|href|action)=(["'])\//g,
    `$1=$2${UPSTREAM_BASE}/`
  );
  body = body.replace(
    /(src|href|action)=(["'])https?:\/\/singingfiles\.com\//g,
    `$1=$2${UPSTREAM_BASE}/`
  );

  // ── Build response — strip headers that block iframe embedding ────────────
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  // Allow our own page to embed this response in an iframe
  headers.set("X-Frame-Options", "ALLOWALL");
  headers.set(
    "Content-Security-Policy",
    "frame-ancestors *"
  );
  // Don't cache — CPAGrip content is dynamic per user
  headers.set("Cache-Control", "no-store");

  return new NextResponse(body, {
    status: upstreamRes.status,
    headers,
  });
}
