-- Check current transactions table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if recipient_id column exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'recipient_id'
    AND table_schema = 'public'
) as recipient_id_exists; 