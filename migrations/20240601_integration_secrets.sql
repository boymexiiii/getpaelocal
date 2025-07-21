-- Migration: Integration Secrets (API Key/Secret Management)

CREATE TABLE IF NOT EXISTS integration_secrets (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_integration_secrets_name ON integration_secrets(name);
CREATE INDEX IF NOT EXISTS idx_integration_secrets_created_by ON integration_secrets(created_by); 