import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/timewall-callback
//
// TimeWall server-to-server postback handler.
//
// Configure in the TimeWall dashboard under "Postback URL":
//
//   https://janarewards.xyz/api/timewall-callback
//     ?user_id={SUBID}
//     &payout={REWARD}
//     &transaction_id={TXID}
//     &offer_name={OFFER_NAME}
//     &secret=YOUR_TIMEWALL_SECRET
//
// TimeWall macro mapping:
//   {SUBID}      — the sub_id / subid we appended at redirect (= our click_id)
//   {REWARD}     — USD payout for the completed offer
//   {TXID}       — TimeWall's unique transaction identifier
//   {OFFER_NAME} — human-readable offer title
//
// Required environment variables:
//   TIMEWALL_SECRET   — shared secret configured in the TimeWall dashboard
//
// TimeWall expects plain-text "1" on success, "0" on failure.
// ─────────────────────────────────────────────────────────────────────────────

// ── Response helpers ──────────────────────────────────────────────────────────
const OK     = () => new NextResponse("1", { status: 200, headers: { "Content-Type": "text/plain" } });
const REJECT = (msg: string, code = 400) => new NextResponse(msg, { status: code, headers: { "Content-Type": "text/plain" } });

// ── Audit logger ──────────────────────────────────────────────────────────────
async function writeLog(params: {
  user_id_raw:      string | null;
  payout_raw:       string | null;
  transaction_id:   string | null;
  status:           "success" | "duplicate" | "error" | "rejected";
  error_message?:   string;
  points_credited?: number;
  ip_address:       string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("postback_logs").insert({
      provider:        "timewall",
      user_id_raw:     params.user_id_raw    ?? null,
      payout_raw:      params.payout_raw     ?? null,
      transaction_id:  params.transaction_id ?? null,
      status:          params.status,
      error_message:   params.error_message  ?? null,
      points_credited: params.points_credited ?? null,
      ip_address:      params.ip_address,
    });
  } catch (e) {
    console.error("[timewall] writeLog failed:", e);
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  // ── Rate limit: 120 requests/min per IP ───────────────────────────────────
  const rl = checkRateLimit(ip, { limit: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return REJECT("rate limited", 429);
  }

  const { searchParams } = new URL(request.url);

  // ── 1. Validate shared secret ─────────────────────────────────────────────
  const expectedSecret = process.env.TIMEWALL_SECRET;
  if (!expectedSecret) {
    console.error("[timewall] TIMEWALL_SECRET not configured on server");
    return REJECT("server misconfiguration", 500);
  }

  const providedSecret = searchParams.get("secret") ?? "";
  if (providedSecret !== expectedSecret) {
    await writeLog({
      user_id_raw:    searchParams.get("user_id"),
      payout_raw:     searchParams.get("payout"),
      transaction_id: searchParams.get("transaction_id"),
      status:         "rejected",
      error_message:  "Invalid secret",
      ip_address:     ip,
    });
    console.warn(`[timewall] Invalid secret from IP ${ip}`);
    return REJECT("unauthorized", 401);
  }

  // ── 2. Extract & validate parameters ─────────────────────────────────────
  // "user_id" here is actually our click_id — passed as sub_id at redirect time
  const clickId     = searchParams.get("user_id")?.trim()       ?? "";
  const payoutRaw   = searchParams.get("payout")                ?? null;
  const txId        = searchParams.get("transaction_id")?.trim() ?? null;
  const offerName   = (searchParams.get("offer_name") ?? "TimeWall Offer")
                        .replace(/[<>"'`]/g, "")
                        .slice(0, 120)
                        .trim();

  if (!clickId) {
    return REJECT("missing user_id", 400);
  }

  if (!txId) {
    await writeLog({ user_id_raw: clickId, payout_raw: payoutRaw, transaction_id: null, status: "error", error_message: "Missing transaction_id", ip_address: ip });
    return REJECT("missing transaction_id", 400);
  }

  const payout = parseFloat(payoutRaw ?? "");
  if (isNaN(payout) || payout <= 0 || payout > 500) {
    await writeLog({ user_id_raw: clickId, payout_raw: payoutRaw, transaction_id: txId, status: "error", error_message: `Invalid payout: "${payoutRaw}"`, ip_address: ip });
    return REJECT("invalid payout", 400);
  }

  // ── 3. Atomic process via process_conversion() RPC ────────────────────────
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("process_conversion", {
    p_transaction_id: txId,
    p_click_id:       clickId,
    p_amount_usd:     payout,
    p_offer_name:     offerName,
    p_offerwall:      "timewall",
  });

  if (error) {
    console.error("[timewall] process_conversion RPC error:", error.message);
    await writeLog({ user_id_raw: clickId, payout_raw: payoutRaw, transaction_id: txId, status: "error", error_message: `RPC error: ${error.message}`, ip_address: ip });
    return REJECT("processing error", 500);
  }

  const outcome = data as string;

  if (outcome === "duplicate") {
    await writeLog({ user_id_raw: clickId, payout_raw: payoutRaw, transaction_id: txId, status: "duplicate", ip_address: ip });
    console.log(`[timewall] Duplicate TX: ${txId}`);
    return OK();   // return "1" — duplicate is not an error from TimeWall's perspective
  }

  if (outcome.startsWith("error:")) {
    const msg = outcome.replace("error:", "");
    await writeLog({ user_id_raw: clickId, payout_raw: payoutRaw, transaction_id: txId, status: "error", error_message: msg, ip_address: ip });
    console.error(`[timewall] process_conversion error for TX ${txId}: ${msg}`);
    return REJECT(msg.includes("user_not_found") ? "user not found" : "processing error", 400);
  }

  // outcome === "credited"
  const pointsCredited = Math.round(payout * 100);
  await writeLog({ user_id_raw: clickId, payout_raw: payoutRaw, transaction_id: txId, status: "success", points_credited: pointsCredited, ip_address: ip });
  console.log(`[timewall] Credited ${pointsCredited} pts for click_id=${clickId} TX=${txId}`);

  return OK();
}
