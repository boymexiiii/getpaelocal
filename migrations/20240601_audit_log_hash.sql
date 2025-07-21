-- Migration: Audit Log Hash/Signature for Tamper-Proofing

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS prev_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs(hash); 