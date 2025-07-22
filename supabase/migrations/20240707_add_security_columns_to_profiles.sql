-- Add 2FA and notification preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS twofa_secret TEXT,
  ADD COLUMN IF NOT EXISTS twofa_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS login_notifications_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS transaction_alerts_enabled BOOLEAN DEFAULT TRUE; 