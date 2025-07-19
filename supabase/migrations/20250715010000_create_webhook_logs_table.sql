-- Create webhook_logs table for logging webhook events and errors
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event text NOT NULL,
  payload jsonb,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by provider and status
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_status ON webhook_logs(provider, status); 