-- Fix the audit trigger function to properly handle IP address casting
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ip_addr TEXT;
  parsed_ip INET;
BEGIN
  -- Safely extract and cast IP address
  BEGIN
    ip_addr := current_setting('request.headers', true)::json->>'x-forwarded-for';
    -- Handle comma-separated IPs (take first one)
    IF ip_addr IS NOT NULL THEN
      ip_addr := split_part(ip_addr, ',', 1);
      ip_addr := trim(ip_addr);
      -- Try to cast to inet, if it fails, set to null
      parsed_ip := ip_addr::inet;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    parsed_ip := NULL;
  END;

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
      parsed_ip,
      current_setting('request.headers', true)::json->>'user-agent'
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
      parsed_ip,
      current_setting('request.headers', true)::json->>'user-agent'
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
      parsed_ip,
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;