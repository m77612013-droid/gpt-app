-- ============================================================
-- Migration: Add total_earned column to profiles
-- Run this in your Supabase SQL Editor AFTER the initial schema
-- ============================================================

-- Add total_earned to profiles if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_earned NUMERIC NOT NULL DEFAULT 0 CHECK (total_earned >= 0);

-- Back-fill: compute total_earned from completed transactions
UPDATE public.profiles p
SET total_earned = COALESCE((
  SELECT SUM(t.points_earned)
  FROM public.transactions t
  WHERE t.user_id = p.id
    AND t.status = 'completed'
), 0);

-- ── Trigger: keep total_earned in sync automatically ──────────────────────
CREATE OR REPLACE FUNCTION public.sync_total_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE public.profiles
    SET total_earned = total_earned + NEW.points_earned
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_transaction_insert ON public.transactions;
CREATE TRIGGER on_transaction_insert
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_total_earned();
