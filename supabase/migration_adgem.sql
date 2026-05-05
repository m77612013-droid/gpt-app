-- ============================================================
-- AdGem Server Postback — Migration
-- Run this in your Supabase SQL Editor.
--
-- The project already has a `transactions` table with a UNIQUE
-- constraint on `transaction_id`, which is all that is needed
-- for deduplication.  This migration:
--   1. Ensures the index that powers fast duplicate-checks exists.
--   2. Ensures the `postback_logs` table accepts "adgem" as a
--      provider (no schema change needed — provider is TEXT).
--   3. (Optional) Creates a dedicated `completed_offers` view
--      for easy admin querying of AdGem-specific transactions.
-- ============================================================

-- ── 1. Fast duplicate-check index (idempotent) ────────────────
-- Already present in schema.sql; included here for safety.
CREATE INDEX IF NOT EXISTS idx_transactions_tx_id
  ON public.transactions (transaction_id);

-- ── 2. Partial index scoped to AdGem (optional, performance) ──
CREATE INDEX IF NOT EXISTS idx_transactions_adgem
  ON public.transactions (transaction_id)
  WHERE provider = 'adgem';

-- ── 3. Convenience view: completed_offers (AdGem) ─────────────
-- Surfaces all AdGem-rewarded rows for quick auditing.
CREATE OR REPLACE VIEW public.adgem_completed_offers AS
SELECT
  t.id,
  t.user_id,
  p.email,
  t.offer_name,
  t.points_earned,
  t.transaction_id,
  t.status,
  t.created_at
FROM public.transactions t
JOIN public.profiles p ON p.id = t.user_id
WHERE t.provider = 'adgem'
ORDER BY t.created_at DESC;

-- ── 4. Grant read access to the view ─────────────────────────
-- Service role (used by the API) already bypasses RLS, so this
-- grant is only needed if you want to query the view from the
-- anon/authenticated role (e.g. admin dashboard).
-- GRANT SELECT ON public.adgem_completed_offers TO authenticated;
