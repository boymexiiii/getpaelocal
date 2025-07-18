
-- Safely enable RLS and create policies only if they don't exist

-- Enable RLS on tables that don't have it yet
DO $$
BEGIN
    -- Enable RLS on profiles if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on wallets if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'wallets' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add foreign key constraints for data integrity (skip if they already exist)
DO $$
BEGIN
    -- Add profiles foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add wallets foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wallets_user_id_fkey' AND table_name = 'wallets'
    ) THEN
        ALTER TABLE public.wallets
        ADD CONSTRAINT wallets_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add transactions user_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_user_id_fkey' AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add transactions recipient_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_recipient_id_fkey' AND table_name = 'transactions'
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_recipient_id_fkey 
        FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add investments foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'investments_user_id_fkey' AND table_name = 'investments'
    ) THEN
        ALTER TABLE public.investments
        ADD CONSTRAINT investments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add virtual_cards foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'virtual_cards_user_id_fkey' AND table_name = 'virtual_cards'
    ) THEN
        ALTER TABLE public.virtual_cards
        ADD CONSTRAINT virtual_cards_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create transaction limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transaction_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  daily_send_limit NUMERIC DEFAULT 100000.00,
  daily_spend_limit NUMERIC DEFAULT 50000.00,
  monthly_limit NUMERIC DEFAULT 1000000.00,
  kyc_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on transaction_limits
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'transaction_limits' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.transaction_limits ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create transaction limits policy if it doesn't exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own limits" ON public.transaction_limits;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_limits' AND policyname = 'Users can view their own limits') THEN
        CREATE POLICY "Users can view their own limits" ON public.transaction_limits
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'audit_logs' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create audit logs policy if it doesn't exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs') THEN
        CREATE POLICY "Admins can view audit logs" ON public.audit_logs
        FOR SELECT USING (false); -- Will be updated when admin roles are implemented
    END IF;
END $$;

-- Create function to automatically create transaction limits for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.transaction_limits (user_id, kyc_level)
  VALUES (NEW.id, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_limits') THEN
        CREATE TRIGGER on_auth_user_created_limits
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_limits();
    END IF;
END $$;
