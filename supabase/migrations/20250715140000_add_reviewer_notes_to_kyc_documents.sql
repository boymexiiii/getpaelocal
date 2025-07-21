-- Add reviewer_notes column to kyc_documents for per-document admin feedback
ALTER TABLE kyc_documents ADD COLUMN reviewer_notes text; 