-- ============================================================
-- GPT (Get Paid To) App – Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Enable UUID generation ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 1. profiles
--    Extends Supabase's built-in auth.users with app-specific data.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name        TEXT        NOT NULL DEFAULT '',
  email            TEXT        UNIQUE NOT NULL,
  balance_points   NUMERIC     NOT NULL DEFAULT 0 CHECK (balance_points >= 0),
  total_earned     NUMERIC     NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-populate a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 2. transactions
--    Logs every points-earning event (postback, offer completion, etc.)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  offer_name     TEXT        NOT NULL DEFAULT 'Unknown Offer',
  points_earned  NUMERIC     NOT NULL DEFAULT 0,
  provider       TEXT        NOT NULL DEFAULT 'unknown',  -- e.g. monlix, cpalead, lootably
  transaction_id TEXT        UNIQUE,                      -- provider-side TX ID for deduplication
  status         TEXT        NOT NULL DEFAULT 'completed'
                             CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id      ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created      ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_id        ON public.transactions (transaction_id);

-- ── Migration: run this if the table already exists without the new columns ──
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS provider       TEXT NOT NULL DEFAULT 'unknown';
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_id TEXT UNIQUE;

-- ──────────────────────────────────────────────────────────────
-- 3. withdrawals
--    Tracks cash-out requests from users.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount          NUMERIC     NOT NULL CHECK (amount > 0),
  payment_method  TEXT        NOT NULL
                              CHECK (payment_method IN ('ShamCard', 'PayPal', 'Syriatel Cash', 'MTN Cash', 'USDT')),
  account_details TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status  ON public.withdrawals (status);

-- ──────────────────────────────────────────────────────────────
-- 4. settings
--    Admin-managed key-value store (offerwall IDs, secrets, etc.)
--    Only service-role (admin) can read or write.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default rows so the admin form always has something to display
INSERT INTO public.settings (key, value) VALUES
  ('monlix_app_id',          ''),
  ('monlix_secret_key',      ''),
  ('revlum_api_key',         ''),
  ('lootably_placement_id',  ''),
  ('cpalead_app_id',         ''),
  ('adgate_app_id',          ''),
  ('adscend_app_id',         '')
ON CONFLICT (key) DO NOTHING;

-- RLS: block all direct client access — only service-role key bypasses this
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings: no direct client access"
  ON public.settings FOR ALL USING (FALSE);


-- ──────────────────────────────────────────────────────────────

-- profiles
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals  ENABLE ROW LEVEL SECURITY;

-- Users can read/update only their own profile
CREATE POLICY "profiles: owner access"
  ON public.profiles
  FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can read their own transactions; server-side (service role) can insert
CREATE POLICY "transactions: owner read"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions: service insert"
  ON public.transactions
  FOR INSERT
  WITH CHECK (TRUE); -- The postback route uses the service-role key, bypasses RLS

-- Users can read/insert their own withdrawal requests
CREATE POLICY "withdrawals: owner read"
  ON public.withdrawals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "withdrawals: owner insert"
  ON public.withdrawals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
