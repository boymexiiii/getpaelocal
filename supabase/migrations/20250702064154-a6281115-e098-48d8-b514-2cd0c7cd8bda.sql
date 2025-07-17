-- Enable audit logging for critical tables
-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      action,
      record_id,
      old_data,
      user_id,
      ip_address,
      user_agent
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      OLD.id,
      to_jsonb(OLD),
      auth.uid(),
      current_setting('request.headers')::json->>'x-forwarded-for',
      current_setting('request.headers')::json->>'user-agent'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      action,
      record_id,
      old_data,
      new_data,
      user_id,
      ip_address,
      user_agent
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid(),
      current_setting('request.headers')::json->>'x-forwarded-for',
      current_setting('request.headers')::json->>'user-agent'
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name,
      action,
      record_id,
      new_data,
      user_id,
      ip_address,
      user_agent
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      to_jsonb(NEW),
      auth.uid(),
      current_setting('request.headers')::json->>'x-forwarded-for',
      current_setting('request.headers')::json->>'user-agent'
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for critical tables
CREATE TRIGGER audit_trigger_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_wallets
  AFTER INSERT OR UPDATE OR DELETE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_kyc_applications
  AFTER INSERT OR UPDATE OR DELETE ON public.kyc_applications
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limiting policies
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" ON public.rate_limits
  FOR ALL USING (true);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  endpoint_name TEXT,
  max_requests INTEGER DEFAULT 60,
  window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := now() - (window_minutes || ' minutes')::INTERVAL;
  
  -- Clean up old entries
  DELETE FROM public.rate_limits 
  WHERE window_start < window_start_time;
  
  -- Count current requests
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_count
  FROM public.rate_limits
  WHERE user_id = auth.uid()
    AND endpoint = endpoint_name
    AND window_start >= window_start_time;
  
  -- Check if limit exceeded
  IF current_count >= max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO public.rate_limits (user_id, endpoint, request_count)
  VALUES (auth.uid(), endpoint_name, 1)
  ON CONFLICT (user_id, endpoint, window_start) 
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;