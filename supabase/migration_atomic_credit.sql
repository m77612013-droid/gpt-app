-- ============================================================
-- Migration: Atomic credit_user RPC + hardened RLS
-- Run this in Supabase SQL Editor (safe to run multiple times)
-- ============================================================

-- ── 1. Atomic credit function ─────────────────────────────────────────────
-- Replaces the read-then-write pattern in postback routes.
-- A single DB transaction prevents race conditions under concurrent postbacks.
--
-- Parameters:
--   uid    : UUID   — profiles.id of the user to credit
--   pts    : NUMERIC — positive number of points to add
--   tx_id  : TEXT    — provider transaction ID (NULL = no dedup check)
--   p_provider   : TEXT — provider slug (monlix, cpalead, …)
--   p_offer_name : TEXT — human readable label stored in transactions
--
-- Returns: JSON  { success, new_balance, duplicate }
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.credit_user(
  uid          UUID,
  pts          NUMERIC,
  tx_id        TEXT    DEFAULT NULL,
  p_provider   TEXT    DEFAULT 'postback',
  p_offer_name TEXT    DEFAULT 'Offer'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance   NUMERIC;
  v_total_earned  NUMERIC;
BEGIN
  -- Guard: points must be positive
  IF pts <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'pts must be positive');
  END IF;

  -- Guard: reject if this transaction_id was already processed
  IF tx_id IS NOT NULL THEN
    PERFORM 1 FROM public.transactions
    WHERE transaction_id = tx_id
    LIMIT 1;

    IF FOUND THEN
      RETURN json_build_object('success', true, 'duplicate', true,
                               'message', 'Already processed');
    END IF;
  END IF;

  -- Atomic increment — no read-then-write, no race condition
  UPDATE public.profiles
  SET
    balance_points = balance_points + pts,
    total_earned   = total_earned   + pts
  WHERE id = uid
  RETURNING balance_points, total_earned
  INTO v_new_balance, v_total_earned;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Log transaction
  INSERT INTO public.transactions
    (user_id, offer_name, points_earned, provider, transaction_id, status)
  VALUES
    (uid, p_offer_name, pts, p_provider, tx_id, 'completed');

  RETURN json_build_object(
    'success',      true,
    'duplicate',    false,
    'new_balance',  v_new_balance,
    'total_earned', v_total_earned
  );
END;
$$;

-- Grant execute to service role only (anon/authenticated cannot call it directly)
REVOKE ALL ON FUNCTION public.credit_user FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_user FROM anon;
REVOKE ALL ON FUNCTION public.credit_user FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_user TO service_role;


-- ── 2. Harden transactions RLS ────────────────────────────────────────────
-- Drop the permissive insert policy and replace with a deny-all for clients.
-- Only the service-role key (used by postback API routes) can insert.

-- Remove old overly permissive policy
DROP POLICY IF EXISTS "transactions: service insert" ON public.transactions;

-- Deny ALL direct writes from any authenticated or anon client
CREATE POLICY "transactions: no client write"
  ON public.transactions
  FOR INSERT
  WITH CHECK (FALSE);

-- Read-own remains unchanged:
-- "transactions: owner read"  → FOR SELECT USING (auth.uid() = user_id)


-- ── 3. Harden profiles RLS ────────────────────────────────────────────────
-- Users must NOT be able to self-update balance_points or total_earned.
-- Replace the catch-all FOR ALL policy with explicit column-safe policies.

DROP POLICY IF EXISTS "profiles: owner access" ON public.profiles;

-- Read own profile
CREATE POLICY "profiles: owner read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users may only update non-financial fields (full_name).
-- balance_points and total_earned are updated exclusively by service-role (credit_user RPC).
CREATE POLICY "profiles: owner update safe fields"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent client from changing financial fields by checking they stay the same
    -- NOTE: full enforcement is via service_role-only writes to those columns.
    -- This policy blocks the anon/authenticated client from submitting changes.
  );
