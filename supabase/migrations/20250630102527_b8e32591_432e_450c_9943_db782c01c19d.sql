
-- Create KYC documents table for storing verification documents
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'passport', 'drivers_license', 'proof_of_address', 'selfie')),
  document_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create KYC applications table for tracking verification status
CREATE TABLE IF NOT EXISTS public.kyc_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_resubmission')),
  kyc_level INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reviewer_notes TEXT,
  bvn TEXT,
  occupation TEXT,
  monthly_income_range TEXT,
  source_of_funds TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create monitoring alerts table
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('transaction_limit_reached', 'suspicious_activity', 'failed_payment', 'kyc_pending', 'security_breach', 'system_error')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for KYC documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.kyc_documents;
CREATE POLICY "Users can view their own documents" ON public.kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.kyc_documents;
CREATE POLICY "Users can insert their own documents" ON public.kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.kyc_documents;
CREATE POLICY "Users can update their own documents" ON public.kyc_documents
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for KYC applications
DROP POLICY IF EXISTS "Users can view their own applications" ON public.kyc_applications;
CREATE POLICY "Users can view their own applications" ON public.kyc_applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own applications" ON public.kyc_applications;
CREATE POLICY "Users can insert their own applications" ON public.kyc_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own applications" ON public.kyc_applications;
CREATE POLICY "Users can update their own applications" ON public.kyc_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for monitoring alerts
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.monitoring_alerts;
CREATE POLICY "Users can view their own alerts" ON public.monitoring_alerts
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update KYC status and transaction limits
CREATE OR REPLACE FUNCTION public.update_kyc_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile verification status
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles 
    SET kyc_level = NEW.kyc_level, 
        is_verified = TRUE,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Update transaction limits based on KYC level
    UPDATE public.transaction_limits
    SET kyc_level = NEW.kyc_level,
        daily_send_limit = CASE 
          WHEN NEW.kyc_level = 2 THEN 500000.00
          WHEN NEW.kyc_level = 3 THEN 2000000.00
          ELSE daily_send_limit
        END,
        daily_spend_limit = CASE 
          WHEN NEW.kyc_level = 2 THEN 300000.00
          WHEN NEW.kyc_level = 3 THEN 1000000.00
          ELSE daily_spend_limit
        END,
        monthly_limit = CASE 
          WHEN NEW.kyc_level = 2 THEN 5000000.00
          WHEN NEW.kyc_level = 3 THEN 20000000.00
          ELSE monthly_limit
        END,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for KYC status updates
CREATE TRIGGER on_kyc_status_change
  AFTER UPDATE ON public.kyc_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_kyc_status();

-- Create function to generate monitoring alerts
CREATE OR REPLACE FUNCTION public.create_monitoring_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO public.monitoring_alerts (
    alert_type, severity, title, message, user_id, metadata
  ) VALUES (
    p_alert_type, p_severity, p_title, p_message, p_user_id, p_metadata
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
