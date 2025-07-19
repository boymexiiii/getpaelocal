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

-- Index for fast lookup by admin and action
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_action ON admin_actions(admin_id, action); 