-- User Assets Table
CREATE TABLE IF NOT EXISTS user_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- e.g., crypto, stock, real_estate, custom
  name text NOT NULL,
  value numeric NOT NULL,
  currency text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User Liabilities Table
CREATE TABLE IF NOT EXISTS user_liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- e.g., mortgage, loan, credit_card, custom
  name text NOT NULL,
  value numeric NOT NULL,
  currency text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user_liab FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
); 