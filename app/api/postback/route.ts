import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Universal Postback Handler — GET /api/postback
 *
 * Uses the atomic credit_user() Postgres RPC — no race conditions.
 *
 * Required query parameters:
 *   user_id       — profiles.id (UUID)
 *   payout_amount — positive number of points to credit
 *   secret_key    — must match POSTBACK_SECRET_KEY env var
 *
 * Optional:
 *   provider       — provider slug (monlix, cpalead, lootably, adscend, adgate)
 *   offer_name     — human-readable label (max 120 chars)
 *   transaction_id — provider TX id for deduplication
 *
 * URL templates:
 *   Monlix:       ?user_id={userid}&payout_amount={reward}&offer_name={offer_name}&provider=monlix&transaction_id={txid}&secret_key=SECRET
 *   CPALead:      ?user_id={subid}&payout_amount={payout}&provider=cpalead&transaction_id={txid}&secret_key=SECRET
 *   Lootably:     ?user_id={user_id}&payout_amount={points}&provider=lootably&transaction_id={txid}&secret_key=SECRET
 *   AdscendMedia: ?user_id={subid1}&payout_amount={amount}&provider=adscend&transaction_id={txid}&secret_key=SECRET
 *   AdGate:       ?user_id={user_id}&payout_amount={points}&provider=adgate&transaction_id={txid}&secret_key=SECRET
 *   CPAGrip:      ?user_id={sub1}&payout_amount={cash}&provider=cpagrip&transaction_id={txid}&secret_key=SECRET
 *                 ↑ NOTE: CPAGrip uses {sub1} for user and {cash} for payout (NOT {amount})
 */

const PROVIDER_LABELS: Record<string, string> = {
  monlix:   "Monlix Survey",
  cpalead:  "CPALead App Install",
  lootably: "Lootably Game",
  adscend:  "AdscendMedia Video",
  adgate:   "AdGate Quick Task",
  cpagrip:  "CPAGrip Offer",
  daily:    "Daily Bonus",
};

function sanitize(val: string | null, max: number): string {
  if (!val) return "";
  return val.replace(/[<>"'`]/g, "").slice(0, max).trim();
}

export async function GET(request: NextRequest) {
  // ── 0. Rate limit (120 req/min per IP) ───────────────────────────────────
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { limit: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
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

  // ── 1. Secret key ────────────────────────────────────────────────────────
  const expectedSecret = process.env.POSTBACK_SECRET_KEY;
  const secretKey      = searchParams.get("secret_key");

  if (!expectedSecret) {
    console.error("[postback] POSTBACK_SECRET_KEY not set");
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }
  if (secretKey !== expectedSecret) {
    console.warn(`[postback] Invalid secret from IP ${ip}`);
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Parse & sanitize parameters ──────────────────────────────────────
  const userId        = sanitize(searchParams.get("user_id"), 36);
  const payoutRaw     = searchParams.get("payout_amount");
  const provider      = sanitize(searchParams.get("provider") ?? "unknown", 32).toLowerCase();
  const offerNameRaw  = sanitize(searchParams.get("offer_name"), 120);
  const offerName     = offerNameRaw || PROVIDER_LABELS[provider] || provider;
  const transactionId = sanitize(searchParams.get("transaction_id"), 128) || null;

  if (!userId || !payoutRaw) {
    return NextResponse.json(
      { error: "Missing required parameters: user_id and payout_amount." },
      { status: 400 }
    );
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user_id format." }, { status: 400 });
  }

  const payoutFloat = parseFloat(payoutRaw);
  if (isNaN(payoutFloat) || payoutFloat <= 0 || payoutFloat > 1_000) {
    return NextResponse.json(
      { error: "payout_amount must be a positive number (max 1,000)." },
      { status: 400 }
    );
  }
  // Convert dollar payout → points (1$ = 1000 points)
  const pointsEarned = Math.round(payoutFloat * 1000);

  // ── 3. Atomic credit via Postgres RPC (no race condition) ────────────────
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("credit_user", {
    uid:          userId,
    pts:          pointsEarned,
    tx_id:        transactionId,
    p_provider:   provider,
    p_offer_name: offerName,
  });

  if (error) {
    console.error("[postback] credit_user RPC error:", error);
    return NextResponse.json({ error: "Failed to process reward." }, { status: 500 });
  }

  const result = data as {
    success: boolean;
    duplicate?: boolean;
    error?: string;
    new_balance?: number;
    total_earned?: number;
  };

  if (!result.success) {
    const status = result.error === "User not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (result.duplicate) {
    // Return "1" so CPAGrip marks the conversion as Success (idempotent)
    return new NextResponse("1", { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  // CPAGrip (and most CPA networks) require a plain "1" response to confirm success
  return new NextResponse("1", { status: 200, headers: { "Content-Type": "text/plain" } });
}
