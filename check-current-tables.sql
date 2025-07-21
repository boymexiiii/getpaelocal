-- =====================================================
-- CHECK CURRENT DATABASE STRUCTURE
-- This script shows what tables exist and their columns
-- =====================================================

-- List all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check profiles table structure (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE '📋 Profiles table exists. Checking columns...';
        
        -- List all columns in profiles table
        PERFORM column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND table_schema = 'public'
        ORDER BY ordinal_position;
        
    ELSE
        RAISE NOTICE '❌ Profiles table does not exist!';
    END IF;
END $$;

-- Check if other key tables exist
SELECT 
    'profiles' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') as exists
UNION ALL
SELECT 
    'wallets' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets' AND table_schema = 'public') as exists
UNION ALL
SELECT 
    'transactions' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') as exists
UNION ALL
SELECT 
    'notifications' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') as exists
UNION ALL
SELECT 
    'otps' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'otps' AND table_schema = 'public') as exists; 