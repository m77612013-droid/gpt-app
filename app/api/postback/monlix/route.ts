import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Monlix-specific Postback Handler — GET /api/postback/monlix
 *
 * Uses the atomic credit_user() Postgres RPC — no race conditions.
 * Updates BOTH balance_points AND total_earned consistently.
 *
 * Configure in Monlix dashboard:
 *   https://yourdomain.com/api/postback/monlix
 *     ?user_id={userid}
 *     &payout={reward}
 *     &transaction_id={txid}
 *     &offer_name={offer_name}
 *     &secret_key=YOUR_POSTBACK_SECRET_KEY
 *
 * Security: secret key + optional IP whitelist + rate limiting
 */

const MONLIX_DEFAULT_IPS = [
  "162.208.22.149",
  "162.208.22.150",
  "162.208.22.151",
];

function sanitize(val: string | null, max: number): string {
  if (!val) return "";
  return val.replace(/[<>"'`]/g, "").slice(0, max).trim();
}

export async function GET(request: NextRequest) {
  // ── 0. Rate limit ────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { limit: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);

  // ── 1. Secret key ────────────────────────────────────────────────────────
  const expectedSecret = process.env.POSTBACK_SECRET_KEY;
  const secretKey      = searchParams.get("secret_key");

  if (!expectedSecret) {
    console.error("[monlix-postback] POSTBACK_SECRET_KEY not set");
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }
  if (secretKey !== expectedSecret) {
    console.warn(`[monlix-postback] Invalid secret from IP ${ip}`);
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Optional IP whitelist ─────────────────────────────────────────────
  if (process.env.MONLIX_IP_CHECK_ENABLED === "true") {
    const allowedIps = process.env.MONLIX_ALLOWED_IPS
      ? process.env.MONLIX_ALLOWED_IPS.split(",").map((s) => s.trim())
      : MONLIX_DEFAULT_IPS;

    if (!allowedIps.includes(ip)) {
      console.warn(`[monlix-postback] Blocked IP: ${ip}`);
      return NextResponse.json({ error: "Unauthorized – IP not allowed." }, { status: 401 });
    }
  }

  // ── 3. Parse & sanitize parameters ──────────────────────────────────────
  const userId        = sanitize(searchParams.get("user_id"), 36);
  const payoutRaw     = searchParams.get("payout");
  const transactionId = sanitize(searchParams.get("transaction_id"), 128) || null;
  const offerName     = sanitize(searchParams.get("offer_name"), 120) || "Monlix Offer";

  if (!userId || !payoutRaw) {
    return NextResponse.json(
      { error: "Missing required parameters: user_id and payout." },
      { status: 400 }
    );
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user_id format." }, { status: 400 });
  }

  const pointsEarned = parseFloat(payoutRaw);
  if (isNaN(pointsEarned) || pointsEarned <= 0 || pointsEarned > 1_000_000) {
    return NextResponse.json(
      { error: "payout must be a positive number (max 1,000,000)." },
      { status: 400 }
    );
  }

  // ── 4. Atomic credit via Postgres RPC ────────────────────────────────────
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("credit_user", {
    uid:          userId,
    pts:          pointsEarned,
    tx_id:        transactionId,
    p_provider:   "monlix",
    p_offer_name: offerName,
  });

  if (error) {
    console.error("[monlix-postback] credit_user RPC error:", error);
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
    console.log(`[monlix-postback] Dup tx ${transactionId} — ignored.`);
    return NextResponse.json({ success: true, duplicate: true }, { status: 200 });
  }

  console.log(
    `[monlix-postback] ✓ Credited ${pointsEarned} pts → user ${userId} | tx: ${transactionId ?? "n/a"}`
  );

  return NextResponse.json(
    {
      success:      true,
      new_balance:  result.new_balance,
      total_earned: result.total_earned,
    },
    { status: 200 }
  );
}
