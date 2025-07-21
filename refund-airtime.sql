-- Refund 55 naira airtime payment that didn't reach the user
-- This script will:
-- 1. Find the recent 55 naira bill payment transaction
-- 2. Refund the user's wallet
-- 3. Update the transaction status to refunded
-- 4. Create a refund transaction record

-- Step 1: Find the transaction and user wallet
WITH transaction_info AS (
  SELECT 
    t.id as transaction_id,
    t.user_id,
    t.amount,
    t.reference,
    t.description,
    w.id as wallet_id,
    w.balance as current_balance
  FROM transactions t
  JOIN wallets w ON t.user_id = w.user_id AND w.currency = 'NGN'
  WHERE t.amount = 55 
    AND t.transaction_type = 'bill_payment'
    AND t.status != 'refunded'
  ORDER BY t.created_at DESC
  LIMIT 1
)

-- Step 2: Update wallet balance (refund)
UPDATE wallets 
SET balance = balance + 55
WHERE id IN (SELECT wallet_id FROM transaction_info);

-- Step 3: Update original transaction status
UPDATE transactions 
SET 
  status = 'refunded',
  description = description || ' (REFUNDED - Airtime not delivered)'
WHERE id IN (SELECT transaction_id FROM transaction_info);

-- Step 4: Create refund transaction record
INSERT INTO transactions (
  user_id,
  transaction_type,
  amount,
  currency,
  description,
  status,
  reference,
  recipient_id
)
SELECT 
  user_id,
  'refund',
  55,
  'NGN',
  'Refund for failed airtime payment - ' || reference,
  'completed',
  'REFUND_' || reference,
  NULL
FROM transaction_info;

-- Step 5: Show the results
SELECT 
  'Refund processed successfully' as message,
  t.user_id,
  t.amount,
  t.reference,
  w.balance as new_wallet_balance
FROM transaction_info t
JOIN wallets w ON t.wallet_id = w.id; 