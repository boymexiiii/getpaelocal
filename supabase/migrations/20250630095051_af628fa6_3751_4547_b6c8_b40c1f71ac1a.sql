
-- Check and create missing RLS policies

-- For transactions table (enable RLS if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'transactions' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create missing policies for transactions if they don't exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
    CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR auth.uid() = recipient_id);
    DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
    CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
    CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
END $$;

-- For investments table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'investments' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create missing policies for investments
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
    CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
    CREATE POLICY "Users can update their own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert their own investments" ON public.investments;
    CREATE POLICY "Users can insert their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- For virtual_cards table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'virtual_cards' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create missing policies for virtual_cards
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own virtual cards" ON public.virtual_cards;
    CREATE POLICY "Users can view their own virtual cards" ON public.virtual_cards FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update their own virtual cards" ON public.virtual_cards;
    CREATE POLICY "Users can update their own virtual cards" ON public.virtual_cards FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert their own virtual cards" ON public.virtual_cards;
    CREATE POLICY "Users can insert their own virtual cards" ON public.virtual_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;
