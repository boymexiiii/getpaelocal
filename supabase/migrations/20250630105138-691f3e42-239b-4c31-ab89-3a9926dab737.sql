
-- Add missing BVN verification columns to kyc_applications table
ALTER TABLE public.kyc_applications 
ADD COLUMN IF NOT EXISTS bvn_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bvn_verification_data jsonb;

-- Add index for better performance on BVN verification queries
CREATE INDEX IF NOT EXISTS idx_kyc_applications_bvn_verified 
ON public.kyc_applications(bvn_verified);
