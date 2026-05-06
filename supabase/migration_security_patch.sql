-- ============================================================
-- Security & Correctness Patch — run after
-- migration_offerwall_tracking.sql
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- FIX 1  process_conversion() — Race condition + idempotency gap
-- ──────────────────────────────────────────────────────────────
--
-- PROBLEMS FIXED:
--
-- A. Race condition (double-credit risk)
--    Two concurrent calls with the same transaction_id could both
--    pass the original idempotency check (SELECT … WHERE processed = TRUE)
--    before either had inserted the conversions row.  Both would then call
--    credit_user(), causing a double-credit.
--
--    FIX: pg_advisory_xact_lock(hashtext(p_transaction_id)) is acquired at
--    the very start of the function.  PostgreSQL serialises all callers of
--    process_conversion() that share the same transaction_id hash.  The lock
--    is automatically released when the calling transaction ends.
--
-- B. Idempotency gap (partial failure window)
--    The original check only looked at conversions WHERE processed = TRUE.
--    If credit_user() succeeded but the INSERT into conversions then crashed,
--    a retry would find no processed row, call credit_user() again, and that
--    call would return { success: true, duplicate: true } — so the function
--    would fall through to the conversions INSERT and return 'credited'
--    instead of 'duplicate'.  Not a double-credit (credit_user deduplicates
--    via UNIQUE on transactions.transaction_id) but it produces a misleading
--    return value and an extra conversions row.
--
--    FIX: Also check public.transactions for the tx_id.  If it's already
--    there the credit already happened; we reconcile any leftover state and
--    return 'duplicate'.
--
-- C. Unhandled unique_violation on conversions INSERT
--    Under extreme concurrency the ON CONFLICT clause could still fail if
--    the advisory lock hash collides (extremely rare) or if called outside
--    the function.  An EXCEPTION block now catches unique_violation and
--    returns 'duplicate' cleanly.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_conversion(
  p_transaction_id   TEXT,
  p_click_id         TEXT,
  p_amount_usd       NUMERIC,
  p_offer_name       TEXT,
  p_offerwall        TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id     UUID;
  v_points      INT;
  v_credit_res  JSONB;
BEGIN
  -- ── Serialise concurrent calls for the same transaction_id ───────────────
  -- pg_advisory_xact_lock is transaction-scoped; released automatically on
  -- COMMIT / ROLLBACK.  hashtext() maps the TEXT key to a BIGINT bucket.
  -- Two callers with the same key will queue here; the second will then hit
  -- the idempotency check below and return 'duplicate' immediately.
  PERFORM pg_advisory_xact_lock(hashtext('process_conversion:' || p_transaction_id));

  -- ── Primary idempotency check — conversions table ────────────────────────
  IF EXISTS (
    SELECT 1 FROM public.conversions
    WHERE  transaction_id = p_transaction_id
      AND  processed = TRUE
  ) THEN
    RETURN 'duplicate';
  END IF;

  -- ── Secondary idempotency check — transactions table ─────────────────────
  -- Handles the partial-failure window: credit_user() succeeded but the
  -- subsequent INSERT into conversions crashed before it committed.
  -- In that case the credit already landed; reconcile and return 'duplicate'.
  IF EXISTS (
    SELECT 1 FROM public.transactions
    WHERE  transaction_id = p_transaction_id
  ) THEN
    -- Reconcile: make sure the conversions row exists and is marked processed,
    -- and that the originating click is marked completed.
    INSERT INTO public.conversions (
      click_id, amount_earned, transaction_id, offerwall_name,
      offer_name, processed, processed_at
    )
    VALUES (
      p_click_id, p_amount_usd, p_transaction_id, p_offerwall,
      p_offer_name, TRUE, NOW()
    )
    ON CONFLICT (transaction_id) DO UPDATE
      SET processed    = TRUE,
          processed_at = COALESCE(public.conversions.processed_at, NOW());

    UPDATE public.offers_log
    SET    status = 'completed'
    WHERE  click_id = p_click_id
      AND  status <> 'completed';

    RETURN 'duplicate';
  END IF;

  -- ── Resolve user from click_id ───────────────────────────────────────────
  SELECT user_id INTO v_user_id
  FROM   public.offers_log
  WHERE  click_id = p_click_id
  LIMIT  1;

  IF v_user_id IS NULL THEN
    RETURN 'error:user_not_found';
  END IF;

  -- ── Validate amount ──────────────────────────────────────────────────────
  IF p_amount_usd <= 0 OR p_amount_usd > 500 THEN
    RETURN 'error:invalid_amount';
  END IF;

  -- ── Convert USD → points (100 pts = $1.00) ───────────────────────────────
  v_points := GREATEST(1, ROUND(p_amount_usd * 100)::INT);

  -- ── Credit the user via the existing atomic RPC ──────────────────────────
  SELECT public.credit_user(
    uid          => v_user_id,
    pts          => v_points,
    tx_id        => p_transaction_id,
    p_provider   => p_offerwall,
    p_offer_name => COALESCE(NULLIF(TRIM(p_offer_name), ''), p_offerwall || ' Offer')
  )::JSONB INTO v_credit_res;

  -- credit_user() returns {success:true, duplicate:true} for known tx_ids —
  -- treat that as a duplicate rather than an error.
  IF (v_credit_res->>'duplicate')::BOOLEAN IS TRUE THEN
    RETURN 'duplicate';
  END IF;

  IF NOT (v_credit_res->>'success')::BOOLEAN THEN
    RETURN 'error:credit_failed:' || COALESCE(v_credit_res->>'error', 'unknown');
  END IF;

  -- ── Mark conversion as processed ─────────────────────────────────────────
  INSERT INTO public.conversions (
    click_id, amount_earned, transaction_id, offerwall_name,
    offer_name, processed, processed_at
  )
  VALUES (
    p_click_id, p_amount_usd, p_transaction_id, p_offerwall,
    p_offer_name, TRUE, NOW()
  )
  ON CONFLICT (transaction_id) DO UPDATE
    SET processed    = TRUE,
        processed_at = NOW();

  -- ── Mark the originating click as completed ───────────────────────────────
  UPDATE public.offers_log
  SET    status = 'completed'
  WHERE  click_id = p_click_id;

  RETURN 'credited';

EXCEPTION
  -- Catches any unique_violation that slips through the advisory lock
  -- (e.g. a hash collision or a direct call from outside this function).
  WHEN unique_violation THEN
    RETURN 'duplicate';
  WHEN OTHERS THEN
    RAISE WARNING '[process_conversion] Unexpected error for tx_id=%: %', p_transaction_id, SQLERRM;
    RETURN 'error:unexpected:' || SQLERRM;
END;
$$;


-- ──────────────────────────────────────────────────────────────
-- FIX 2  offers_log — missing 'adgate' in CHECK constraint
-- ──────────────────────────────────────────────────────────────
--
-- PROBLEM: The redirect route accepts offerwall = 'adgate' (it is in the
-- VALID_OFFERWALLS set), but the database CHECK constraint on
-- offers_log.offerwall_name did not include 'adgate'.  Any AdGate redirect
-- would cause a CHECK constraint violation on INSERT, silently drop the
-- click log entry, and leave the user with an untracked click.
--
-- FIX: Drop the old constraint and recreate it with 'adgate' included.
-- ──────────────────────────────────────────────────────────────

-- Drop the existing named constraint (Postgres auto-names it)
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT conname INTO v_constraint
  FROM   pg_constraint
  WHERE  conrelid = 'public.offers_log'::regclass
    AND  contype  = 'c'
    AND  pg_get_constraintdef(oid) LIKE '%adgem%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.offers_log DROP CONSTRAINT ' || quote_ident(v_constraint);
  END IF;
END
$$;

ALTER TABLE public.offers_log
  ADD CONSTRAINT offers_log_offerwall_name_check
  CHECK (offerwall_name IN ('adgem', 'timewall', 'cpagrip', 'monlix', 'lootably', 'adgate', 'unknown'));


-- ──────────────────────────────────────────────────────────────
-- FIX 3  offers_log RLS — overly permissive "service full access" policy
-- ──────────────────────────────────────────────────────────────
--
-- PROBLEM: The original "service full access" policy used USING(TRUE)
-- WITHOUT restricting to the service_role.  This means any authenticated
-- browser session could INSERT, UPDATE, or DELETE any row in offers_log —
-- including rows belonging to other users.  The service-role key already
-- bypasses RLS entirely, so this policy provided no benefit while opening
-- a significant privilege-escalation vector.
--
-- FIX: Drop the overly-permissive policy and replace it with a narrowly
-- scoped INSERT-only policy for authenticated users (so the redirect route
-- can insert via the anon/service key), plus explicit UPDATE for the
-- service_role path.  All writes from API routes already use the service-
-- role key and therefore bypass RLS — but the policy must still be correct
-- for any future authenticated-role writes.
-- ──────────────────────────────────────────────────────────────

-- Remove the dangerous catch-all policy
DROP POLICY IF EXISTS "offers_log: service full access" ON public.offers_log;

-- Users may only insert their OWN rows (user_id must match their session uid).
-- The redirect route uses the service-role key and bypasses this entirely.
CREATE POLICY "offers_log: owner insert"
  ON public.offers_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users may update only their OWN rows (e.g. future client-side cancellation).
CREATE POLICY "offers_log: owner update"
  ON public.offers_log FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No authenticated client should be able to delete click logs.
-- Only service-role (bypasses RLS) may delete rows (e.g. admin cleanup).
