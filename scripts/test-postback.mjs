/**
 * Mock Postback Test Script
 * ─────────────────────────
 * Sends a simulated postback request to the local dev server.
 * Usage:
 *   1. Start dev server:  npm run dev
 *   2. Set your user UUID below (copy from Supabase → Table Editor → profiles → id)
 *   3. Run:  node scripts/test-postback.mjs
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
const BASE_URL    = "http://localhost:3000";
const SECRET_KEY  = "Anas_2026_Rewards";

// ⬇️  CHANGE THIS to your real profile UUID from Supabase
const USER_ID     = "REPLACE_WITH_YOUR_USER_UUID";

const PAYOUT      = "0.17";          // $0.17 → 170 points
const PROVIDER    = "cpagrip";
const OFFER_NAME  = "Test+Offer+17+cents";
const TX_ID       = `test_${Date.now()}`;   // unique each run

// ── BUILD URL ─────────────────────────────────────────────────────────────────
const url = new URL(`${BASE_URL}/api/postback`);
url.searchParams.set("user_id",       USER_ID);
url.searchParams.set("payout_amount", PAYOUT);
url.searchParams.set("provider",      PROVIDER);
url.searchParams.set("offer_name",    OFFER_NAME);
url.searchParams.set("transaction_id",TX_ID);
url.searchParams.set("secret_key",    SECRET_KEY);

console.log("\n🧪  Sending mock postback...");
console.log("   URL:", url.toString());
console.log("   Expected points credited: " + Math.round(parseFloat(PAYOUT) * 1000));

// ── FIRE REQUEST ──────────────────────────────────────────────────────────────
try {
  const res  = await fetch(url.toString());
  const body = await res.text();

  console.log("\n📬  Response:");
  console.log("   Status :", res.status);
  console.log("   Body   :", body);

  if (res.status === 200 && body.trim() === "1") {
    console.log('\n✅  SUCCESS — postback accepted! Check /admin/transactions');
    console.log('   The user should now have +170 points in balance_points.');
  } else if (res.status === 401) {
    console.log('\n❌  UNAUTHORIZED — secret_key mismatch.');
    console.log('   Make sure POSTBACK_SECRET_KEY=Anas_2026_Rewards in .env.local');
    console.log('   AND the same value is set in Vercel Dashboard env vars.');
  } else if (res.status === 500) {
    console.log('\n❌  SERVER ERROR — likely SUPABASE_SERVICE_ROLE_KEY not set.');
    console.log('   Run:  vercel env pull .env.local  to pull all env vars.');
  } else if (res.status === 404) {
    console.log('\n❌  USER NOT FOUND — the UUID is not in the profiles table.');
    console.log('   Go to Supabase → Table Editor → profiles, copy the real id column value.');
  } else if (res.status === 400) {
    console.log('\n⚠️   BAD REQUEST:', body);
  } else {
    console.log('\n⚠️   Unexpected response:', res.status, body);
  }
} catch (err) {
  console.error('\n🔴  Network error — is "npm run dev" running on port 3000?', err.message);
}
