-- Top up wallet for kingsleyanamelechi422@gmail.com with 150 naira

-- First, find the user
DO $$
DECLARE
    user_id UUID;
    wallet_id UUID;
    current_balance DECIMAL;
    new_balance DECIMAL;
    topup_amount DECIMAL := 150;
BEGIN
    -- Find the user by email
    SELECT id INTO user_id 
    FROM profiles 
    WHERE email = 'kingsleyanamelechi422@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with email: kingsleyanamelechi422@gmail.com';
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', user_id;
    
    -- Check if user has a wallet
    SELECT id, balance INTO wallet_id, current_balance
    FROM wallets 
    WHERE user_id = user_id AND currency = 'NGN';
    
    IF wallet_id IS NULL THEN
        -- Create new wallet
        INSERT INTO wallets (user_id, currency, balance, created_at)
        VALUES (user_id, 'NGN', topup_amount, NOW())
        RETURNING id INTO wallet_id;
        
        RAISE NOTICE 'Created new wallet with ID: % and balance: %', wallet_id, topup_amount;
    ELSE
        -- Update existing wallet
        new_balance := current_balance + topup_amount;
        UPDATE wallets 
        SET balance = new_balance 
        WHERE id = wallet_id;
        
        RAISE NOTICE 'Updated wallet balance from % to %', current_balance, new_balance;
    END IF;
    
    -- Create transaction record
    INSERT INTO transactions (
        user_id, 
        transaction_type, 
        amount, 
        currency, 
        description, 
        status, 
        reference, 
        created_at
    ) VALUES (
        user_id,
        'deposit',
        topup_amount,
        'NGN',
        'Wallet top-up',
        'completed',
        'TOPUP-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
        NOW()
    );
    
    RAISE NOTICE 'Transaction record created successfully';
    RAISE NOTICE 'Successfully topped up wallet with ₦%', topup_amount;
    
END $$; 