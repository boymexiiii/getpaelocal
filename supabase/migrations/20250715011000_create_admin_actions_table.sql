-- Create admin_actions table for logging admin actions
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by admin and action (only if table exists and column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_actions' AND column_name = 'action')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_actions_admin_action') THEN
        CREATE INDEX idx_admin_actions_admin_action ON admin_actions(admin_id, action);
    END IF;
END $$; 