-- ============================================================
-- Offerwall Click Tracking — Migration
-- Run this in your Supabase SQL Editor.
--
-- Adds two new tables:
--   1. offers_log   — records every outbound click before the user
--                     lands on an offer.  Used to correlate inbound
--                     postbacks / reporting-API conversions.
--   2. conversions  — raw conversion records fetched from the
--                     AdGem / TimeWall reporting APIs.  Processed
--                     rows trigger a credit on profiles.balance_points.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. offers_log
--    One row per click — written by GET /api/redirect before the
--    user is forwarded to the offer page.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offers_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,

  -- Unique token generated at redirect time and passed as sub-ID to
  -- the offerwall.  Used to match inbound postbacks / API reports.
  click_id       TEXT        NOT NULL UNIQUE,

  -- Provider-side offer identifier (may be NULL at click time for
  -- wall-based flows where we don't know the offer in advance).
  offer_id       TEXT,

  offerwall_name TEXT        NOT NULL DEFAULT 'unknown'
                             CHECK (offerwall_name IN ('adgem', 'timewall', 'cpagrip', 'monlix', 'lootably', 'unknown')),

  -- USD payout expected (filled in when the offer is known; may be
  -- updated later when the postback/report arrives).
  payout         NUMERIC     CHECK (payout >= 0),

  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'completed', 'rejected')),

  -- Source IP of the browser click — stored for fraud/duplicate checks.
  ip_address     TEXT,

  clicked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_log_user_id      ON public.offers_log (user_id);
CREATE INDEX IF NOT EXISTS idx_offers_log_click_id     ON public.offers_log (click_id);
CREATE INDEX IF NOT EXISTS idx_offers_log_status       ON public.offers_log (status);
CREATE INDEX IF NOT EXISTS idx_offers_log_offerwall    ON public.offers_log (offerwall_name);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.touch_offers_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_offers_log_updated ON public.offers_log;
CREATE TRIGGER trg_offers_log_updated
  BEFORE UPDATE ON public.offers_log
  FOR EACH ROW EXECUTE FUNCTION public.touch_offers_log();

-- RLS: users can only see their own clicks; server (service role) can do everything
ALTER TABLE public.offers_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_log: owner read"
  ON public.offers_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "offers_log: service full access"
  ON public.offers_log FOR ALL
  USING     (TRUE)
  WITH CHECK (TRUE);   -- bypassed by service-role key; fine for postback routes


-- ──────────────────────────────────────────────────────────────
-- 2. conversions
--    Raw records fetched from the AdGem / TimeWall reporting API
--    by the /api/adgem-sync and /api/timewall-sync cron routes.
--    A background job (or the same sync route) reads rows where
--    processed = FALSE, credits the user, then marks them TRUE.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links to the original click that generated this conversion.
  -- NULL if the offerwall sent a postback without a recognisable click_id.
  click_id        TEXT        REFERENCES public.offers_log (click_id) ON DELETE SET NULL,

  -- The USD amount reported by the provider.
  amount_earned   NUMERIC     NOT NULL CHECK (amount_earned > 0),

  -- Provider-side transaction ID — used to prevent double-processing.
  transaction_id  TEXT        NOT NULL UNIQUE,

  offerwall_name  TEXT        NOT NULL DEFAULT 'unknown',

  -- Human-readable offer title returned by the reporting API.
  offer_name      TEXT,

  -- Raw JSON payload from the reporting API (for debugging).
  raw_payload     JSONB,

  -- FALSE = not yet credited; TRUE = points already added to profile.
  processed       BOOLEAN     NOT NULL DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversions_click_id       ON public.conversions (click_id);
CREATE INDEX IF NOT EXISTS idx_conversions_tx_id          ON public.conversions (transaction_id);
CREATE INDEX IF NOT EXISTS idx_conversions_processed      ON public.conversions (processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_conversions_offerwall      ON public.conversions (offerwall_name);

-- RLS: only service-role key may access this table directly
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversions: service only"
  ON public.conversions FOR ALL
  USING (FALSE);   -- client requests always blocked; service-role bypasses this


-- ──────────────────────────────────────────────────────────────
-- 3. Stored procedure — process_conversion()
--    Called by the sync routes.  Atomically:
--      a) marks the conversion as processed
--      b) sets offers_log.status = 'completed'
--      c) credits profiles.balance_points via the existing credit_user() RPC
--    Returns 'credited', 'duplicate', or 'error'.
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
  -- ── Idempotency check ────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM public.conversions
    WHERE transaction_id = p_transaction_id AND processed = TRUE
  ) THEN
    RETURN 'duplicate';
  END IF;

  -- ── Resolve user from click_id ───────────────────────────────
  SELECT user_id INTO v_user_id
  FROM   public.offers_log
  WHERE  click_id = p_click_id
  LIMIT  1;

  IF v_user_id IS NULL THEN
    RETURN 'error:user_not_found';
  END IF;

  -- ── Convert USD → points (100 pts = $1.00) ───────────────────
  v_points := GREATEST(1, ROUND(p_amount_usd * 100)::INT);

  -- ── Credit the user via the existing atomic RPC ──────────────
  SELECT public.credit_user(
    uid          => v_user_id,
    pts          => v_points,
    tx_id        => p_transaction_id,
    p_provider   => p_offerwall,
    p_offer_name => COALESCE(p_offer_name, p_offerwall || ' Offer')
  )::JSONB INTO v_credit_res;

  IF NOT (v_credit_res->>'success')::BOOLEAN THEN
    RETURN 'error:credit_failed:' || COALESCE(v_credit_res->>'error', 'unknown');
  END IF;

  -- ── Mark conversion as processed ─────────────────────────────
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

  -- ── Mark the originating click as completed ───────────────────
  UPDATE public.offers_log
  SET    status = 'completed'
  WHERE  click_id = p_click_id;

  RETURN 'credited';
END;
$$;
