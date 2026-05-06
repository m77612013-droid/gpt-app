import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/adgem-sync    (or GET with ?secret=... for cron services)
//
// AdGem Reporting API sync — pulls daily conversions from:
//   https://dashboard.adgem.com/v1/report
// and credits users whose click_id appears as the sub-affiliate ID.
//
// Designed to be called by:
//   • Vercel Cron   (vercel.json: "crons": [{ "path": "/api/adgem-sync", "schedule": "0 * * * *" }])
//   • Any external cron service via a POST with the correct cron_secret header
//
// Required environment variables:
//   ADGEM_API_KEY       — Bearer token for the AdGem dashboard API
//   CRON_SECRET         — Shared secret to protect this endpoint from public access
//
// AdGem API docs: https://dashboard.adgem.com/docs/reporting
// ─────────────────────────────────────────────────────────────────────────────

interface AdGemConversion {
  id:               number;
  app_id:           number;
  offer_id:         number;
  offer_name:       string;
  sub_id?:          string;  // our click_id
  subid?:           string;  // alternative field name
  payout:           string;  // USD as string, e.g. "0.50"
  status:           string;  // "completed" | "pending" | "rejected" | "reversed"
  created_at?:      string;
  conversion_date?: string;
}

interface SyncResult {
  fetched:    number;
  credited:   number;
  duplicates: number;
  errors:     number;
  messages:   string[];
}

// ── Fetch conversions from AdGem Reporting API ────────────────────────────────
async function fetchAdGemConversions(
  apiKey: string,
  dateFrom: string,
  dateTo: string
): Promise<AdGemConversion[]> {
  const url = new URL("https://dashboard.adgem.com/v1/report");
  url.searchParams.set("date_from", dateFrom);
  url.searchParams.set("date_to",   dateTo);
  url.searchParams.set("status",    "completed");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept:         "application/json",
    },
    // Vercel Edge timeout — 30 s is plenty for the reporting endpoint
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`AdGem API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  // The API returns { data: [...] } or a bare array
  if (Array.isArray(json)) return json as AdGemConversion[];
  if (Array.isArray(json?.data)) return json.data as AdGemConversion[];
  throw new Error(`Unexpected AdGem API response shape: ${JSON.stringify(json).slice(0, 200)}`);
}

// ── Core sync logic ────────────────────────────────────────────────────────────
async function runSync(dateFrom: string, dateTo: string): Promise<SyncResult> {
  const result: SyncResult = { fetched: 0, credited: 0, duplicates: 0, errors: 0, messages: [] };

  const apiKey = process.env.ADGEM_API_KEY;
  if (!apiKey) {
    result.errors++;
    result.messages.push("ADGEM_API_KEY environment variable is not configured.");
    return result;
  }

  const admin = createAdminClient();

  // ── 1. Fetch from AdGem ───────────────────────────────────────────────────
  let conversions: AdGemConversion[];
  try {
    conversions = await fetchAdGemConversions(apiKey, dateFrom, dateTo);
  } catch (err) {
    result.errors++;
    result.messages.push(`Failed to fetch from AdGem API: ${(err as Error).message}`);
    return result;
  }
  result.fetched = conversions.length;

  if (conversions.length === 0) {
    result.messages.push("No completed conversions found for the requested date range.");
    return result;
  }

  // ── 2. Process each conversion ────────────────────────────────────────────
  for (const conv of conversions) {
    const txId    = String(conv.id);           // AdGem's own numeric ID as our tx_id
    const clickId = conv.sub_id ?? conv.subid ?? null;
    const payout  = parseFloat(conv.payout);

    if (!clickId) {
      result.messages.push(`Skipped conversion ${txId}: no sub_id (not from our redirect)`);
      continue;
    }

    if (isNaN(payout) || payout <= 0) {
      result.messages.push(`Skipped conversion ${txId}: invalid payout "${conv.payout}"`);
      result.errors++;
      continue;
    }

    // ── 3. Call process_conversion() stored procedure ─────────────────────
    const { data, error } = await admin.rpc("process_conversion", {
      p_transaction_id: txId,
      p_click_id:       clickId,
      p_amount_usd:     payout,
      p_offer_name:     conv.offer_name ?? "AdGem Offer",
      p_offerwall:      "adgem",
    });

    if (error) {
      result.errors++;
      result.messages.push(`Error processing ${txId}: ${error.message}`);
      continue;
    }

    const outcome = data as string;
    if (outcome === "credited") {
      result.credited++;
    } else if (outcome === "duplicate") {
      result.duplicates++;
    } else if (outcome.startsWith("error:user_not_found")) {
      // click_id may belong to another app — not an error, just skip
      result.messages.push(`Skipped ${txId}: click_id "${clickId}" not found in offers_log`);
    } else {
      result.errors++;
      result.messages.push(`Unexpected outcome for ${txId}: ${outcome}`);
    }
  }

  result.messages.push(
    `Sync complete — fetched: ${result.fetched}, credited: ${result.credited}, ` +
    `duplicates: ${result.duplicates}, errors: ${result.errors}`
  );

  return result;
}

// ── Shared handler ─────────────────────────────────────────────────────────────
async function handleRequest(request: NextRequest): Promise<NextResponse> {
  // ── Auth: CRON_SECRET or Authorization header ──────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured on server." }, { status: 500 });
  }

  // Vercel Cron sends the secret in the Authorization header as "Bearer <secret>"
  const authHeader = request.headers.get("authorization") ?? "";
  const querySecret = new URL(request.url).searchParams.get("secret") ?? "";

  const providedSecret = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : querySecret;

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Date range — default to yesterday + today ─────────────────────────────
  const { searchParams } = new URL(request.url);

  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateFrom = searchParams.get("date_from") ?? isoDate(yesterday);
  const dateTo   = searchParams.get("date_to")   ?? isoDate(today);

  // Validate date format (YYYY-MM-DD)
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(dateFrom) || !DATE_RE.test(dateTo)) {
    return NextResponse.json(
      { error: "date_from and date_to must be in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  console.log(`[adgem-sync] Starting sync for ${dateFrom} → ${dateTo}`);

  const result = await runSync(dateFrom, dateTo);

  console.log("[adgem-sync]", JSON.stringify(result));

  return NextResponse.json({
    success:   result.errors === 0,
    date_from: dateFrom,
    date_to:   dateTo,
    ...result,
  });
}

export async function GET(request: NextRequest)  { return handleRequest(request); }
export async function POST(request: NextRequest) { return handleRequest(request); }
