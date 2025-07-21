-- Add Flutterwave-specific columns to transactions table
-- This script adds the missing columns needed for Flutterwave integration

-- Add flw_reference column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'flw_reference'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN flw_reference TEXT;
        RAISE NOTICE 'Added flw_reference column to transactions table';
    ELSE
        RAISE NOTICE 'flw_reference column already exists';
    END IF;
END $$;

-- Add flw_response column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'flw_response'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN flw_response JSONB;
        RAISE NOTICE 'Added flw_response column to transactions table';
    ELSE
        RAISE NOTICE 'flw_response column already exists';
    END IF;
END $$;

-- Create index on flw_reference for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_transactions_flw_reference'
    ) THEN
        CREATE INDEX idx_transactions_flw_reference ON public.transactions(flw_reference);
        RAISE NOTICE 'Created index on flw_reference column';
    ELSE
        RAISE NOTICE 'Index on flw_reference already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('flw_reference', 'flw_response')
ORDER BY column_name; 