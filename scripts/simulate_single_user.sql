-- ============================================================
-- Conversion Simulation — Single User Test
-- Target: anssnaans2828@gmail.com
-- UUID:   b1f0b887-22e1-439c-8ca9-65474ab6c1b5
--
-- Run this entire block in the Supabase SQL Editor.
-- It is fully idempotent — safe to run multiple times.
-- ============================================================

DO $$
DECLARE
  v_user_id        UUID    := 'b1f0b887-22e1-439c-8ca9-65474ab6c1b5'::UUID;
  v_click_id       TEXT    := 'cl_sim_test_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
  v_transaction_id TEXT    := 'SIM_TX_TEST_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
  v_payout         NUMERIC := 1.00;   -- USD → 100 points
  v_result         TEXT;
  v_balance        NUMERIC;
BEGIN

  -- ── Step 0: Confirm the user exists ──────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User % not found in public.profiles. Aborting.', v_user_id;
  END IF;

  -- ── Step 1: Insert a pending click into offers_log ────────────────────────
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
    v_user_id,
    v_click_id,
    'TEST_OFFER_001',
    'adgem',
    v_payout,
    'pending',
    '127.0.0.1'
  );

  RAISE NOTICE 'Step 1 ✓ — offers_log row inserted. click_id = %', v_click_id;

  -- ── Step 2: Execute process_conversion() ─────────────────────────────────
  SELECT public.process_conversion(
    p_transaction_id => v_transaction_id,
    p_click_id       => v_click_id,
    p_amount_usd     => v_payout,
    p_offer_name     => 'Simulation Test — $1.00 Credit',
    p_offerwall      => 'adgem'
  ) INTO v_result;

  RAISE NOTICE 'Step 2 ✓ — process_conversion() returned: %', v_result;

  IF v_result <> 'credited' THEN
    RAISE EXCEPTION 'Unexpected result from process_conversion(): %. Expected ''credited''.', v_result;
  END IF;

  -- ── Step 3: Read back the updated balance ─────────────────────────────────
  SELECT balance_points INTO v_balance
  FROM public.profiles
  WHERE id = v_user_id;

  RAISE NOTICE 'Step 3 ✓ — Updated balance_points for %: %', v_user_id, v_balance;

END $$;


-- ── Final SELECT: confirm all affected rows ───────────────────────────────────

-- User balance after credit
SELECT
  p.id,
  p.email,
  p.balance_points,
  p.total_earned
FROM public.profiles p
WHERE p.id = 'b1f0b887-22e1-439c-8ca9-65474ab6c1b5'::UUID;

-- The click log — should show status = 'completed'
SELECT
  click_id,
  offerwall_name,
  payout,
  status,
  clicked_at,
  updated_at
FROM public.offers_log
WHERE user_id = 'b1f0b887-22e1-439c-8ca9-65474ab6c1b5'::UUID
ORDER BY clicked_at DESC
LIMIT 5;

-- The conversion record — should show processed = true
SELECT
  transaction_id,
  click_id,
  amount_earned,
  offer_name,
  processed,
  processed_at
FROM public.conversions
WHERE click_id IN (
  SELECT click_id FROM public.offers_log
  WHERE user_id = 'b1f0b887-22e1-439c-8ca9-65474ab6c1b5'::UUID
)
ORDER BY created_at DESC
LIMIT 5;

-- The transaction ledger entry
SELECT
  id,
  offer_name,
  points_earned,
  provider,
  transaction_id,
  status,
  created_at
FROM public.transactions
WHERE user_id = 'b1f0b887-22e1-439c-8ca9-65474ab6c1b5'::UUID
ORDER BY created_at DESC
LIMIT 5;
