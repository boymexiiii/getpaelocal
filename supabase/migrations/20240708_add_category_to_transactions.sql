-- Add category column to transactions for analytics
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS category TEXT; 