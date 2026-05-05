-- ============================================================
-- Migration: Column-level security + Postback failure logs
-- Run this in Supabase SQL Editor (safe to run multiple times)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- FIX 1: Block authenticated users from self-modifying balance
-- ══════════════════════════════════════════════════════════════
-- The previous RLS UPDATE policy (WITH CHECK auth.uid() = id) only
-- checked identity — it did NOT prevent modifying balance_points or
-- total_earned columns directly via the anon/authenticated Supabase client.
--
-- Solution: Revoke UPDATE privilege on financial columns from all
-- non-service-role roles. The credit_user() RPC runs as SECURITY DEFINER
-- (service_role context) so it is unaffected.

REVOKE UPDATE (balance_points, total_earned)
  ON public.profiles
  FROM authenticated;

REVOKE UPDATE (balance_points, total_earned)
  ON public.profiles
  FROM anon;

-- Confirm: only full_name and other non-financial fields remain updatable
-- by a logged-in user. service_role bypasses all of this.


-- ══════════════════════════════════════════════════════════════
-- FIX 2: postback_logs table — persistent error tracking
-- ══════════════════════════════════════════════════════════════
-- Every incoming postback (success, failure, duplicate) is recorded here.
-- Accessible from /admin/transactions via the admin client.

CREATE TABLE IF NOT EXISTS public.postback_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider       TEXT        NOT NULL DEFAULT 'unknown',
  user_id_raw    TEXT,                          -- raw value from URL (may be invalid)
  payout_raw     TEXT,                          -- raw payout string
  transaction_id TEXT,
  status         TEXT        NOT NULL           -- 'success' | 'duplicate' | 'error' | 'rejected'
                             CHECK (status IN ('success', 'duplicate', 'error', 'rejected')),
  error_message  TEXT,                          -- populated on failure
  points_credited NUMERIC,                      -- NULL if failed
  ip_address     TEXT
);

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_postback_logs_received  ON public.postback_logs (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_postback_logs_status    ON public.postback_logs (status);
CREATE INDEX IF NOT EXISTS idx_postback_logs_user      ON public.postback_logs (user_id_raw);

-- RLS: only service_role can insert; admin reads via service_role too
ALTER TABLE public.postback_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "postback_logs: no client access"
  ON public.postback_logs
  FOR ALL
  USING (FALSE);

-- Grant insert to service_role (used by Next.js API route)
GRANT INSERT, SELECT ON public.postback_logs TO service_role;
