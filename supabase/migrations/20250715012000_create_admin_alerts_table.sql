-- Create admin_alerts table for admin notifications and stuck transaction alerts
CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  message text NOT NULL,
  target_type text,
  target_id text,
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by type and status
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type_status ON admin_alerts(alert_type, status); 