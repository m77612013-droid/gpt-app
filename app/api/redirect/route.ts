import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/redirect
//
// Secure bridge redirect for outbound offer links.  Responsibilities:
//   1. Validates the authenticated user (server-side session).
//   2. Generates a unique click_id and persists it to offers_log.
//   3. Appends the personal tracking ID (228784611) to the destination URL.
//   4. Redirects with Referrer-Policy: no-referrer so that the offerwall
//      provider cannot see janarewards.xyz as the referrer domain.
//
// Query parameters:
//   url            — the full offer URL to redirect to (must be HTTPS)
//   offerwall      — provider slug: adgem | timewall | cpagrip | monlix | lootably
//   offer_id       — (optional) provider-side offer identifier
//   payout         — (optional) expected USD payout for this offer
//
// Example:
//   /api/redirect?url=https://wall.adgem.com/...&offerwall=adgem&offer_id=12345&payout=0.50
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAL_TRACKING_ID = "228784611";

// Allowlist of trusted offerwall domains — prevents open-redirect abuse
const TRUSTED_HOSTS = new Set([
  "wall.adgem.com",
  "adgem.com",
  "api.adgem.com",
  "timewall.io",
  "api.timewall.io",
  "cpagrip.com",
  "www.cpagrip.com",
  "monlix.com",
  "api.monlix.com",
  "lootably.com",
  "wall.lootably.com",
  "adgaterewards.com",
]);

const VALID_OFFERWALLS = new Set([
  "adgem", "timewall", "cpagrip", "monlix", "lootably", "adgate", "unknown",
]);

function isValidHttpsUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

function generateClickId(): string {
  // 24 random bytes → 48-char hex string, prefixed with timestamp for sorting
  return `cl_${Date.now()}_${randomBytes(12).toString("hex")}`;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  // ── Rate limit: max 60 redirects/min per IP ───────────────────────────────
  const rl = checkRateLimit(ip, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many redirect requests. Slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawUrl      = searchParams.get("url")       ?? "";
  const offerwall   = (searchParams.get("offerwall") ?? "unknown").toLowerCase();
  const offerId     = searchParams.get("offer_id")   ?? null;
  const payoutParam = searchParams.get("payout")     ?? null;

  // ── 1. Validate destination URL ───────────────────────────────────────────
  const destUrl = isValidHttpsUrl(rawUrl);
  if (!destUrl) {
    return NextResponse.json(
      { error: "Missing or invalid 'url' parameter. Must be a valid HTTPS URL." },
      { status: 400 }
    );
  }

  // ── 2. Domain allowlist — prevent open redirect ───────────────────────────
  if (!TRUSTED_HOSTS.has(destUrl.hostname)) {
    console.warn(`[redirect] Blocked untrusted destination: ${destUrl.hostname} (IP: ${ip})`);
    return NextResponse.json(
      { error: "Destination URL is not permitted." },
      { status: 403 }
    );
  }

  // ── 3. Validate offerwall slug ────────────────────────────────────────────
  if (!VALID_OFFERWALLS.has(offerwall)) {
    return NextResponse.json(
      { error: `Unknown offerwall: "${offerwall}". Valid values: ${[...VALID_OFFERWALLS].join(", ")}` },
      { status: 400 }
    );
  }

  // ── 4. Authenticate user (server-side session) ────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    // Redirect unauthenticated users to the login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 5. Parse & validate payout ────────────────────────────────────────────
  let payout: number | null = null;
  if (payoutParam !== null) {
    const p = parseFloat(payoutParam);
    if (!isNaN(p) && p > 0 && p <= 500) payout = p;
  }

  // ── 6. Generate click_id & log to offers_log ──────────────────────────────
  const clickId = generateClickId();

  const admin = createAdminClient();
  const { error: logErr } = await admin.from("offers_log").insert({
    user_id:        user.id,
    click_id:       clickId,
    offer_id:       offerId ?? null,
    offerwall_name: offerwall,
    payout:         payout,
    status:         "pending",
    ip_address:     ip,
  });

  if (logErr) {
    // Non-fatal — still redirect; log so an admin can investigate
    console.error("[redirect] Failed to insert offers_log row:", logErr.message);
  }

  // ── 7. Append tracking parameters to the destination URL ─────────────────
  // Append our personal account ID so the offerwall credits us for the traffic.
  // The click_id is passed as the sub-ID so inbound postbacks can identify the user.
  destUrl.searchParams.set("user_id", PERSONAL_TRACKING_ID);
  destUrl.searchParams.set("sub_id", clickId);    // sub-affiliate ID → our user token
  destUrl.searchParams.set("subid", clickId);     // some walls use "subid"

  const finalUrl = destUrl.toString();

  console.log(
    `[redirect] user=${user.id} click=${clickId} wall=${offerwall} dest=${finalUrl} ip=${ip}`
  );

  // ── 8. No-referrer HTML bridge page ───────────────────────────────────────
  //
  // WHY NOT A 302?
  // A 302 redirect response with "Referrer-Policy: no-referrer" only controls
  // the policy for documents loaded FROM that response.  Because a 302 carries
  // no document body, the browser does not adopt that policy when following
  // the redirect — it will still forward the referrer URL (janarewards.xyz/...)
  // from the page that originally initiated the navigation.
  //
  // CORRECT APPROACH:
  // Serve a minimal HTML document with:
  //   1. <meta name="referrer" content="no-referrer">
  //      → overrides the document's referrer policy; any navigation away from
  //        this page sends NO Referer header to the destination.
  //   2. <meta http-equiv="refresh" content="0;url=...">
  //      → triggers the navigation after the meta policy is applied.
  //   3. window.location.replace() as a JS fallback (faster than meta-refresh).
  //
  // The destination offerwall server will see the request arrive with no
  // Referer header at all, completely masking janarewards.xyz.
  //
  // SECURITY NOTE: finalUrl is built from a parsed URL object with only
  // allowlisted hostnames, so embedding it in the HTML body is safe.
  // It is additionally HTML-attribute-encoded below as a defence-in-depth.
  const encodedUrl = finalUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="refresh" content="0;url=${encodedUrl}">
  <title>Redirecting…</title>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f0f0f;color:#ccc}</style>
</head>
<body>
  <p>Opening offer… <a href="${encodedUrl}" rel="noreferrer noopener">Click here if not redirected</a></p>
  <script>
    // JS redirect as primary path (faster than meta-refresh, same policy)
    try { window.location.replace("${encodedUrl}"); } catch(e) {}
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type":  "text/html; charset=utf-8",
      // No-store: ensures this page is never served from cache;
      // each click must generate a fresh click_id.
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma:          "no-cache",
      // Prevent search engines from indexing this bridge page
      "X-Robots-Tag":  "noindex, nofollow",
    },
  });
}
