-- ═══════════════════════════════════════════════════════════════
-- DB Audit Queries — run these in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. List latest 20 transactions (did the 17-cent postback arrive?) ──────
SELECT
  t.id,
  t.created_at,
  p.email,
  t.user_id,
  t.offer_name,
  t.provider,
  t.transaction_id,
  t.points_earned,
  t.status
FROM public.transactions t
LEFT JOIN public.profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 20;

-- ── 2. Check the balance of a specific user ───────────────────────────────
-- Replace the email below with your account email
SELECT id, email, balance_points, total_earned, created_at
FROM public.profiles
WHERE email = 'aboutgamaa@gmail.com';

-- ── 3. Verify credit_user() RPC exists ───────────────────────────────────
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name   = 'credit_user';
-- Expected output: 1 row with routine_name = credit_user, routine_type = FUNCTION
-- If 0 rows  → Run supabase/migration_atomic_credit.sql in SQL Editor first!

-- ── 4. Manual repair: add points directly to your account ────────────────
-- ONLY run this if you confirmed the postback fired but balance wasn't updated.
-- Replace the UUID with your real profile id from query #2 above.
/*
SELECT public.credit_user(
  uid          := 'YOUR-PROFILE-UUID-HERE',
  pts          := 170,
  tx_id        := 'manual_repair_17cents',
  p_provider   := 'manual',
  p_offer_name := 'Manual Repair – 17 cent offer'
);
*/
