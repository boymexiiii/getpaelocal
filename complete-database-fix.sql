-- =====================================================
-- COMPLETE DATABASE FIX - DROP AND RECREATE ALL TABLES
-- This script will fix all missing column errors
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 1: DROP ALL EXISTING TABLES (CASCADE)
-- =====================================================

-- Drop all tables in the correct order to avoid foreign key conflicts
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.admin_alerts CASCADE;
DROP TABLE IF EXISTS public.admin_actions CASCADE;
DROP TABLE IF EXISTS public.gift_cards CASCADE;
DROP TABLE IF EXISTS public.virtual_cards CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.otps CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- STEP 2: RECREATE ALL TABLES WITH CORRECT STRUCTURE
-- =====================================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    bvn TEXT,
    bvn_verified BOOLEAN DEFAULT FALSE,
    date_of_birth DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Nigeria',
    postal_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. WALLETS TABLE
CREATE TABLE public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'NGN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'airtime', 'bill_payment', 'investment', 'withdrawal')),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference TEXT UNIQUE,
    flw_reference TEXT,
    flw_response JSONB,
    recipient_phone TEXT,
    recipient_name TEXT,
    recipient_bank TEXT,
    recipient_account TEXT,
    bill_type TEXT,
    bill_provider TEXT,
    bill_number TEXT,
    bill_amount DECIMAL(15,2),
    investment_id UUID,
    wallet_id UUID REFERENCES public.wallets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. INVESTMENTS TABLE
CREATE TABLE public.investments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('savings', 'fixed_deposit', 'mutual_fund', 'stocks')),
    amount DECIMAL(15,2) NOT NULL,
    duration INTEGER, -- in days
    interest_rate DECIMAL(5,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matured', 'cancelled')),
    maturity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. OTPS TABLE
CREATE TABLE public.otps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'transaction')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BANK_ACCOUNTS TABLE
CREATE TABLE public.bank_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. VIRTUAL_CARDS TABLE
CREATE TABLE public.virtual_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    card_number TEXT,
    card_type TEXT DEFAULT 'visa',
    expiry_month INTEGER,
    expiry_year INTEGER,
    cvv TEXT,
    card_pan TEXT,
    card_hash TEXT,
    amount DECIMAL(15,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'NGN',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
    is_funded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. GIFT_CARDS TABLE
CREATE TABLE public.gift_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    card_type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    card_code TEXT,
    card_pin TEXT,
    delivery_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ADMIN_ACTIONS TABLE
CREATE TABLE public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. ADMIN_ALERTS TABLE
CREATE TABLE public.admin_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. WEBHOOK_LOGS TABLE
CREATE TABLE public.webhook_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'received',
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Wallets indexes
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_currency ON public.wallets(currency);

-- Transactions indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_reference ON public.transactions(reference);
CREATE INDEX idx_transactions_flw_reference ON public.transactions(flw_reference);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

-- Investments indexes
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_type ON public.investments(type);
CREATE INDEX idx_investments_status ON public.investments(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- OTPs indexes
CREATE INDEX idx_otps_user_id ON public.otps(user_id);
CREATE INDEX idx_otps_type ON public.otps(type);
CREATE INDEX idx_otps_expires_at ON public.otps(expires_at);

-- Bank accounts indexes
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_account_number ON public.bank_accounts(account_number);

-- Virtual cards indexes
CREATE INDEX idx_virtual_cards_user_id ON public.virtual_cards(user_id);
CREATE INDEX idx_virtual_cards_status ON public.virtual_cards(status);

-- Gift cards indexes
CREATE INDEX idx_gift_cards_user_id ON public.gift_cards(user_id);
CREATE INDEX idx_gift_cards_status ON public.gift_cards(status);

-- Admin actions indexes
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at);

-- Admin alerts indexes
CREATE INDEX idx_admin_alerts_severity ON public.admin_alerts(severity);
CREATE INDEX idx_admin_alerts_is_resolved ON public.admin_alerts(is_resolved);
CREATE INDEX idx_admin_alerts_created_at ON public.admin_alerts(created_at);

-- Webhook logs indexes
CREATE INDEX idx_webhook_logs_provider ON public.webhook_logs(provider);
CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Investments policies
CREATE POLICY "Users can view own investments" ON public.investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON public.investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON public.investments
    FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- OTPs policies
CREATE POLICY "Users can view own otps" ON public.otps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own otps" ON public.otps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own otps" ON public.otps
    FOR UPDATE USING (auth.uid() = user_id);

-- Bank accounts policies
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts" ON public.bank_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Virtual cards policies
CREATE POLICY "Users can view own virtual cards" ON public.virtual_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual cards" ON public.virtual_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual cards" ON public.virtual_cards
    FOR UPDATE USING (auth.uid() = user_id);

-- Gift cards policies
CREATE POLICY "Users can view own gift cards" ON public.gift_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gift cards" ON public.gift_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gift cards" ON public.gift_cards
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin actions policies (admin only)
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin alerts policies (admin only)
CREATE POLICY "Admins can view all admin alerts" ON public.admin_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update admin alerts" ON public.admin_alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Webhook logs policies (admin only)
CREATE POLICY "Admins can view all webhook logs" ON public.webhook_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can insert webhook logs" ON public.webhook_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_cards_updated_at BEFORE UPDATE ON public.virtual_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON public.gift_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create wallet on profile creation
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (NEW.id, 0.00, 'NGN');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create wallet when profile is created
CREATE TRIGGER create_wallet_trigger AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_wallet_for_user();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 COMPLETE DATABASE FIX SUCCESSFUL!';
    RAISE NOTICE '✅ All tables have been dropped and recreated with correct structure';
    RAISE NOTICE '📋 All missing columns (email, type, flw_reference, etc.) are now present';
    RAISE NOTICE '🔒 RLS policies have been applied for security';
    RAISE NOTICE '⚡ Indexes have been created for performance';
    RAISE NOTICE '🔄 Triggers have been set up for automatic updates';
    RAISE NOTICE '💡 You can now test the application at http://localhost:8081';
    RAISE NOTICE '🚀 All column errors should be resolved!';
END $$; 