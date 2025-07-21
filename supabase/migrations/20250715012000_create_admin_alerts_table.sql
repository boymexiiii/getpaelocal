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

-- Index for fast lookup by type and status (only if table exists and columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_alerts') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_alerts' AND column_name = 'alert_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_alerts' AND column_name = 'status')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_alerts_type_status') THEN
        CREATE INDEX idx_admin_alerts_type_status ON admin_alerts(alert_type, status);
    END IF;
END $$; 