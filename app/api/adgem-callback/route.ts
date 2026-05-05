import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ── Types ────────────────────────────────────────────────────────────────────
interface AdGemParams {
  appid:          string | null;
  playerid:       string | null;
  amount:         string | null;
  payout:         string | null;
  transaction_id: string | null;
}

interface CreditUserResult {
  success:      boolean;
  duplicate?:   boolean;
  error?:       string;
  new_balance?: number;
  total_earned?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitize(val: string | null, max: number): string {
  if (!val) return "";
  return val.replace(/[<>"'`]/g, "").slice(0, max).trim();
}

// ── Audit logger ──────────────────────────────────────────────────────────────
// Mirrors the pattern used in /api/postback — never throws, never breaks response.
async function writeLog(params: {
  provider:         string;
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
      provider:        params.provider,
      user_id_raw:     params.user_id_raw    ?? null,
      payout_raw:      params.payout_raw     ?? null,
      transaction_id:  params.transaction_id ?? null,
      status:          params.status,
      error_message:   params.error_message  ?? null,
      points_credited: params.points_credited ?? null,
      ip_address:      params.ip_address,
    });
  } catch (e) {
    console.error("[adgem] writeLog failed:", e);
  }
}

// ── Response helpers ──────────────────────────────────────────────────────────
// AdGem requires exactly the body "1" (plain text) on success.
const OK = () =>
  new NextResponse("1", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });

const REJECT = (msg: string, status = 400) =>
  new NextResponse(msg, {
    status,
    headers: { "Content-Type": "text/plain" },
  });

// ── UUID regex ────────────────────────────────────────────────────────────────
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Main handler ──────────────────────────────────────────────────────────────
/**
 * GET /api/adgem-callback
 *
 * AdGem server-postback URL template:
 *   https://yourdomain.com/api/adgem-callback
 *     ?appid={APPID}
 *     &playerid={PLAYERID}
 *     &amount={POINTS}
 *     &payout={PAYOUT}
 *     &transaction_id={TRANSACTION_ID}
 *     &verifykey={VERIFYKEY}
 *
 * Security:
 *   verifykey = md5(appid + playerid + amount + transaction_id + ADGEM_POSTBACK_KEY)
 *
 * playerid must be the user's Supabase UUID (set as the Sub ID when loading the offerwall).
 * amount   is the integer point reward granted by AdGem.
 * payout   is the USD value (informational, stored for logging).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(`adgem:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return REJECT("Too many requests", 429);
  }

  // ── Parse query parameters ─────────────────────────────────────────────────
  const q = req.nextUrl.searchParams;
  const p: AdGemParams = {
    appid:          q.get("appid"),
    playerid:       q.get("playerid"),
    amount:         q.get("amount"),
    payout:         q.get("payout"),
    transaction_id: q.get("transaction_id"),
  };

  // ── Input validation ───────────────────────────────────────────────────────
  const cleanPlayerId = sanitize(p.playerid, 36);
  const cleanTxId     = sanitize(p.transaction_id, 128) || null;

  if (!cleanPlayerId || !p.amount) {
    await writeLog({
      provider: "adgem",
      user_id_raw: cleanPlayerId || null,
      payout_raw: p.payout,
      transaction_id: cleanTxId,
      status: "error",
      error_message: "Missing required params: playerid or amount",
      ip_address: ip,
    });
    return REJECT("Missing required parameters", 400);
  }

  if (!UUID_RE.test(cleanPlayerId)) {
    await writeLog({
      provider: "adgem",
      user_id_raw: cleanPlayerId,
      payout_raw: p.payout,
      transaction_id: cleanTxId,
      status: "error",
      error_message: `Invalid playerid format: "${cleanPlayerId}"`,
      ip_address: ip,
    });
    return REJECT("Invalid playerid format", 400);
  }

  const pointsToCredit = parseInt(p.amount, 10);
  if (isNaN(pointsToCredit) || pointsToCredit <= 0 || pointsToCredit > 100_000) {
    await writeLog({
      provider: "adgem",
      user_id_raw: cleanPlayerId,
      payout_raw: p.payout,
      transaction_id: cleanTxId,
      status: "error",
      error_message: `Invalid amount: "${p.amount}"`,
      ip_address: ip,
    });
    return REJECT("Invalid amount parameter", 400);
  }

  // ── Atomic credit via the shared Postgres RPC ──────────────────────────────
  // credit_user() handles:
  //   • UNIQUE constraint on transaction_id → duplicate detection
  //   • Incrementing balance_points and total_earned atomically
  //   • Inserting the transaction log row
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("credit_user", {
    uid:          cleanPlayerId,
    pts:          pointsToCredit,
    tx_id:        cleanTxId,
    p_provider:   "adgem",
    p_offer_name: "AdGem Offer",
  });

  if (error) {
    console.error("[adgem] credit_user RPC error:", error);
    await writeLog({
      provider: "adgem",
      user_id_raw: cleanPlayerId,
      payout_raw: p.payout,
      transaction_id: cleanTxId,
      status: "error",
      error_message: `RPC error: ${error.message}`,
      ip_address: ip,
    });
    return REJECT("Failed to process reward", 500);
  }

  const result = data as CreditUserResult;

  // ── User not found / other logic error ────────────────────────────────────
  if (!result.success && !result.duplicate) {
    await writeLog({
      provider: "adgem",
      user_id_raw: cleanPlayerId,
      payout_raw: p.payout,
      transaction_id: cleanTxId,
      status: "error",
      error_message: result.error ?? "credit_user returned success=false",
      ip_address: ip,
    });
    // Still return 200 "1" so AdGem doesn't retry for bad user IDs
    return OK();
  }

  // ── Duplicate (already rewarded) ──────────────────────────────────────────
  if (result.duplicate) {
    await writeLog({
      provider: "adgem",
      user_id_raw: cleanPlayerId,
      payout_raw: p.payout,
      transaction_id: cleanTxId,
      status: "duplicate",
      ip_address: ip,
    });
    // Return 200 "1" so AdGem doesn't keep retrying a legitimate duplicate
    return OK();
  }

  // ── Success ───────────────────────────────────────────────────────────────
  await writeLog({
    provider: "adgem",
    user_id_raw: cleanPlayerId,
    payout_raw: p.payout,
    transaction_id: cleanTxId,
    status: "success",
    points_credited: pointsToCredit,
    ip_address: ip,
  });

  console.log(
    `[adgem] ✓ Credited ${pointsToCredit} pts → user ${cleanPlayerId} | tx ${cleanTxId} | new_balance ${result.new_balance}`
  );

  return OK();
}
