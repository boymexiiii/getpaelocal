-- Add spending_limit column to virtual_cards for card controls
ALTER TABLE public.virtual_cards
  ADD COLUMN IF NOT EXISTS spending_limit DECIMAL(15,2); 