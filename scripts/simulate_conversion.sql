-- ============================================================
-- End-to-End Simulation Script
-- janarewards.xyz — Offerwall Tracking System
--
-- PURPOSE:
--   Simulate a complete offer-completion cycle without touching
--   any real user data or live API endpoints.
--
-- HOW TO RUN:
--   Paste the entire file into the Supabase SQL Editor and click
--   "Run".  The final SELECT statements will show the before/after
--   state of every affected table.
--
-- PREREQUISITES:
--   • migration_offerwall_tracking.sql has been run.
--   • migration_security_patch.sql has been run.
--   • At least one real user exists in public.profiles.
--     If not, replace 'REPLACE_WITH_A_REAL_USER_UUID' below with
--     a UUID from:  SELECT id FROM public.profiles LIMIT 1;
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. Configuration — edit these two values before running
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Abort early with a clear message if the placeholder wasn't replaced
  IF 'REPLACE_WITH_A_REAL_USER_UUID' = 'REPLACE_WITH_A_REAL_USER_UUID' THEN
    RAISE NOTICE
      'ACTION REQUIRED: Replace REPLACE_WITH_A_REAL_USER_UUID with a real UUID '
      'from: SELECT id FROM public.profiles LIMIT 1;';
  END IF;
END $$;

-- Simulation constants (change freely)
\set sim_user_id   'REPLACE_WITH_A_REAL_USER_UUID'
\set sim_click_id  'cl_sim_1746528000000_aabbccddeeff0011'
\set sim_tx_id     'SIM_TX_20260506_001'
\set sim_payout    0.50
\set sim_offerwall 'adgem'
\set sim_offer     'Simulated Survey #42'


-- ─────────────────────────────────────────────────────────────
-- 1. Capture baseline balance
-- ─────────────────────────────────────────────────────────────
SELECT
  id,
  email,
  balance_points  AS balance_before,
  total_earned    AS total_earned_before
FROM public.profiles
WHERE id = :'sim_user_id';


-- ─────────────────────────────────────────────────────────────
-- 2. Simulate: user clicks an offer
--    Normally written by GET /api/redirect; we insert directly here.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.offers_log (
  user_id,
  click_id,
  offer_id,
  offerwall_name,
  payout,
  status,
  ip_address
)
VALUES (
  :'sim_user_id',
  :'sim_click_id',
  'offer_99999',          -- fake provider offer ID
  :'sim_offerwall',
  :'sim_payout',
  'pending',
  '127.0.0.1'
);

-- Confirm the click was logged
SELECT * FROM public.offers_log WHERE click_id = :'sim_click_id';


-- ─────────────────────────────────────────────────────────────
-- 3. Simulate: AdGem reports the conversion
--    (In production this is triggered by the hourly cron.
--     Here we call process_conversion() directly.)
-- ─────────────────────────────────────────────────────────────
SELECT public.process_conversion(
  p_transaction_id => :'sim_tx_id',
  p_click_id       => :'sim_click_id',
  p_amount_usd     => :'sim_payout',
  p_offer_name     => :'sim_offer',
  p_offerwall      => :'sim_offerwall'
) AS result;
-- Expected: 'credited'


-- ─────────────────────────────────────────────────────────────
-- 4. Verify idempotency — call a second time with the same IDs
-- ─────────────────────────────────────────────────────────────
SELECT public.process_conversion(
  p_transaction_id => :'sim_tx_id',
  p_click_id       => :'sim_click_id',
  p_amount_usd     => :'sim_payout',
  p_offer_name     => :'sim_offer',
  p_offerwall      => :'sim_offerwall'
) AS result_on_retry;
-- Expected: 'duplicate'   (no extra credit, no error)


-- ─────────────────────────────────────────────────────────────
-- 5. Check all affected tables
-- ─────────────────────────────────────────────────────────────

-- 5a. User balance — should have increased by 50 pts ($0.50 × 100)
SELECT
  id,
  email,
  balance_points  AS balance_after,
  total_earned    AS total_earned_after
FROM public.profiles
WHERE id = :'sim_user_id';

-- 5b. offers_log — status should now be 'completed'
SELECT
  click_id,
  offerwall_name,
  payout,
  status,
  clicked_at,
  updated_at
FROM public.offers_log
WHERE click_id = :'sim_click_id';

-- 5c. conversions — processed = TRUE, processed_at set
SELECT
  transaction_id,
  click_id,
  amount_earned,
  offerwall_name,
  offer_name,
  processed,
  processed_at
FROM public.conversions
WHERE transaction_id = :'sim_tx_id';

-- 5d. transactions — the credit record
SELECT
  id,
  user_id,
  offer_name,
  points_earned,
  provider,
  transaction_id,
  status,
  created_at
FROM public.transactions
WHERE transaction_id = :'sim_tx_id';

-- 5e. postback_logs — written by the timewall/adgem callback routes
--     (Will be empty for this simulation since we called the RPC directly)
SELECT *
FROM public.postback_logs
WHERE transaction_id = :'sim_tx_id';


-- ─────────────────────────────────────────────────────────────
-- 6. Cleanup — removes all simulation rows when you're done
--    Comment this block out if you want the data to persist.
-- ─────────────────────────────────────────────────────────────
/*
DELETE FROM public.transactions WHERE transaction_id = 'SIM_TX_20260506_001';
DELETE FROM public.conversions  WHERE transaction_id = 'SIM_TX_20260506_001';
DELETE FROM public.offers_log   WHERE click_id = 'cl_sim_1746528000000_aabbccddeeff0011';

-- Restore the balance that was added by this simulation
UPDATE public.profiles
SET
  balance_points = balance_points - 50,
  total_earned   = total_earned   - 50
WHERE id = 'REPLACE_WITH_A_REAL_USER_UUID';
*/
