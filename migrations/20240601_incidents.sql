-- Migration: Incidents/Outage Reporting

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  affected_services TEXT[] NOT NULL DEFAULT '{}',
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity); 