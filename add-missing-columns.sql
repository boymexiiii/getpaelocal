-- Add missing columns to existing tables
-- This script adds columns that are missing from the database

-- Add role column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'role column already exists in profiles table';
    END IF;
END $$;

-- Add any other missing columns that might be needed
-- Add date_of_birth column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to profiles table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists in profiles table';
    END IF;
END $$;

-- Add state column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN state TEXT;
        RAISE NOTICE 'Added state column to profiles table';
    ELSE
        RAISE NOTICE 'state column already exists in profiles table';
    END IF;
END $$;

-- Add kyc_level column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'kyc_level'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_level INTEGER DEFAULT 1;
        RAISE NOTICE 'Added kyc_level column to profiles table';
    ELSE
        RAISE NOTICE 'kyc_level column already exists in profiles table';
    END IF;
END $$;

-- Add is_verified column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_verified column to profiles table';
    ELSE
        RAISE NOTICE 'is_verified column already exists in profiles table';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('role', 'date_of_birth', 'state', 'kyc_level', 'is_verified')
ORDER BY column_name; 