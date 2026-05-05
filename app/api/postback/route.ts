import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ── Persistent log helper ────────────────────────────────────────────────────
// Writes every postback attempt to postback_logs for admin visibility.
// Never throws — logging failure must not break the postback response.
async function writeLog(params: {
  provider:        string;
  user_id_raw:     string | null;
  payout_raw:      string | null;
  transaction_id:  string | null;
  status:          "success" | "duplicate" | "error" | "rejected";
  error_message?:  string;
  points_credited?: number;
  ip_address:      string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("postback_logs").insert({
      provider:        params.provider       || "unknown",
      user_id_raw:     params.user_id_raw    || null,
      payout_raw:      params.payout_raw     || null,
      transaction_id:  params.transaction_id || null,
      status:          params.status,
      error_message:   params.error_message  || null,
      points_credited: params.points_credited ?? null,
      ip_address:      params.ip_address,
    });
  } catch (e) {
    // Log to console only — never let logging break the response
    console.error("[postback] writeLog failed:", e);
  }
}

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

// ── Shared core logic ────────────────────────────────────────────────────────
// Used by both GET (query params) and POST (form-data / JSON body)
async function processPostback(params: {
  userId:        string;
  payoutRaw:     string | null;
  secretKey:     string | null;
  provider:      string;
  offerName?:    string;
  transactionId: string | null;
  ip:            string;
  method:        string;
}): Promise<NextResponse> {
  const { userId, payoutRaw, secretKey, provider, offerName: offerNameRaw, transactionId, ip, method } = params;

  // ── 1. Secret key ──────────────────────────────────────────────────────
  const expectedSecret = process.env.POSTBACK_SECRET_KEY;
  if (!expectedSecret) {
    console.error("[postback] POSTBACK_SECRET_KEY not set");
    await writeLog({ provider, user_id_raw: userId, payout_raw: payoutRaw, transaction_id: transactionId, status: "error", error_message: "POSTBACK_SECRET_KEY not configured on server", ip_address: ip });
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }
  if (secretKey !== expectedSecret) {
    console.warn(`[postback][${method}] Invalid secret from IP ${ip} — got "${secretKey?.slice(0, 8)}..."`);
    await writeLog({ provider, user_id_raw: userId, payout_raw: payoutRaw, transaction_id: transactionId, status: "rejected", error_message: `Invalid secret_key. Got: "${secretKey ?? "(none)"}"`, ip_address: ip });
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Validate & sanitize ─────────────────────────────────────────────
  const cleanUserId = sanitize(userId, 36);
  const cleanTxId   = sanitize(transactionId, 128) || null;
  const offerLabel  = sanitize(offerNameRaw ?? "", 120) || PROVIDER_LABELS[provider] || provider;

  if (!cleanUserId || !payoutRaw) {
    await writeLog({ provider, user_id_raw: cleanUserId, payout_raw: payoutRaw, transaction_id: cleanTxId, status: "error", error_message: "Missing user_id or payout_amount", ip_address: ip });
    return NextResponse.json({ error: "Missing required parameters: user_id and payout_amount." }, { status: 400 });
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(cleanUserId)) {
    await writeLog({ provider, user_id_raw: cleanUserId, payout_raw: payoutRaw, transaction_id: cleanTxId, status: "error", error_message: `Invalid user_id format: "${cleanUserId}"`, ip_address: ip });
    return NextResponse.json({ error: "Invalid user_id format." }, { status: 400 });
  }

  const payoutFloat = parseFloat(payoutRaw);
  if (isNaN(payoutFloat) || payoutFloat <= 0 || payoutFloat > 1_000) {
    await writeLog({ provider, user_id_raw: cleanUserId, payout_raw: payoutRaw, transaction_id: cleanTxId, status: "error", error_message: `Invalid payout_amount: "${payoutRaw}"`, ip_address: ip });
    return NextResponse.json({ error: "payout_amount must be a positive number (max 1,000)." }, { status: 400 });
  }

  // Convert dollar payout → points (100 pts = $1.00)
  const pointsEarned = Math.round(payoutFloat * 100);

  // ── 3. Atomic credit via Postgres RPC ─────────────────────────────────
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("credit_user", {
    uid:          cleanUserId,
    pts:          pointsEarned,
    tx_id:        cleanTxId,
    p_provider:   provider,
    p_offer_name: offerLabel,
  });

  if (error) {
    console.error("[postback] credit_user RPC error:", error);
    await writeLog({ provider, user_id_raw: cleanUserId, payout_raw: payoutRaw, transaction_id: cleanTxId, status: "error", error_message: `RPC error: ${error.message}`, ip_address: ip });
    return NextResponse.json({ error: "Failed to process reward." }, { status: 500 });
  }

  const result = data as { success: boolean; duplicate?: boolean; error?: string; new_balance?: number; total_earned?: number; };

  if (!result.success) {
    const status = result.error === "User not found" ? 404 : 400;
    await writeLog({ provider, user_id_raw: cleanUserId, payout_raw: payoutRaw, transaction_id: cleanTxId, status: "error", error_message: result.error ?? "credit_user returned success=false", ip_address: ip });
    return NextResponse.json({ error: result.error }, { status });
  }

  if (result.duplicate) {
    await writeLog({ provider, user_id_raw: cleanUserId, payout_raw: payoutRaw, transaction_id: cleanTxId, status: "duplicate", ip_address: ip });
    return new NextResponse("1", { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  await writeLog({ provider, user_id_raw: cleanUserId, payout_raw: payoutRaw, transaction_id: cleanTxId, status: "success", points_credited: pointsEarned, ip_address: ip });
  return new NextResponse("1", { status: 200, headers: { "Content-Type": "text/plain" } });
}

// ── GET handler — query params (used for testing + other networks) ───────────
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { limit: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)), "X-RateLimit-Remaining": "0" } });
  }

  const { searchParams } = new URL(request.url);
  const fullUrl = request.url.replace(/secret_key=[^&]+/, "secret_key=***REDACTED***");

  const provider = (searchParams.get("provider") ?? "unknown").toLowerCase();
  const userId   = searchParams.get("user_id") ?? searchParams.get("sub1") ?? "";
  const payout   = searchParams.get("payout_amount") ?? searchParams.get("cash") ?? null;
  const txId     = searchParams.get("transaction_id") ?? searchParams.get("txid") ?? null;
  const secret   = searchParams.get("secret_key");

  console.log(`[postback][GET] provider=${provider} user=${userId} payout=${payout} ip=${ip} url=${fullUrl}`);

  return processPostback({ userId, payoutRaw: payout, secretKey: secret, provider, offerName: searchParams.get("offer_name") ?? undefined, transactionId: txId, ip, method: "GET" });
}

// ── POST handler — form-data (CPAGrip S2S Postback) ─────────────────────────
// CPAGrip sends: subid={sub1}, payout={cash}, offer_id={txid}, password=SECRET
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, { limit: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)), "X-RateLimit-Remaining": "0" } });
  }

  // Parse body — support both form-data and JSON
  let fields: Record<string, string> = {};
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = await request.json();
      fields = json as Record<string, string>;
    } else {
      // form-data or application/x-www-form-urlencoded
      const formData = await request.formData();
      formData.forEach((value, key) => { fields[key] = String(value); });
    }
  } catch {
    // fallback: try URL query params (some networks send POST + query params)
    const { searchParams } = new URL(request.url);
    searchParams.forEach((value, key) => { fields[key] = value; });
  }

  // Map CPAGrip POST field names → our internal names
  // CPAGrip POST fields: subid, payout, offer_id, password, [offer_name]
  // Also accept our standard names for compatibility
  const userId   = fields["subid"]     ?? fields["user_id"]    ?? fields["sub1"]              ?? "";
  const payout   = fields["payout"]    ?? fields["payout_amount"] ?? fields["cash"]            ?? null;
  const txId     = fields["offer_id"]  ?? fields["transaction_id"] ?? fields["txid"]           ?? null;
  const secret   = fields["password"]  ?? fields["secret_key"]                                 ?? null;
  const provider = (fields["provider"] ?? "cpagrip").toLowerCase();
  const offerName = fields["offer_name"] ?? undefined;

  console.log(`[postback][POST] provider=${provider} user=${userId} payout=${payout} offer_id=${txId} ip=${ip}`);

  return processPostback({ userId, payoutRaw: payout, secretKey: secret, provider, offerName, transactionId: txId, ip, method: "POST" });
}
