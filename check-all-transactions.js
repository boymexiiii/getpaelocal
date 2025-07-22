import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase credentials (set in .env or deployment environment)
const supabaseUrl = process.env.SUPABASE_URL || 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNoa3R5a3hoY2piZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzMwMTksImV4cCI6MjA2NjUwOTAxOX0.RV42GZbBYIrf6Qyyn0Q7aRlmTu2e';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTransactions() {
  try {
    console.log('🔍 Checking all transactions in the database...');
    
    // Find all transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      return;
    }

    if (!transactions || transactions.length === 0) {
      console.log('❌ No transactions found in the database');
      return;
    }

    console.log(`📋 Found ${transactions.length} transactions:`);
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Type: ${tx.transaction_type}, Amount: ₦${tx.amount}, Status: ${tx.status}, Description: ${tx.description}, Created: ${tx.created_at}`);
    });

    // Check wallet balances
    console.log('\n💰 Checking wallet balances...');
    
    const { data: wallets, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });

    if (walletError) {
      console.error('❌ Error fetching wallets:', walletError);
      return;
    }

    if (wallets && wallets.length > 0) {
      console.log(`💰 Found ${wallets.length} wallets:`);
      
      wallets.forEach((wallet, index) => {
        console.log(`${index + 1}. User: ${wallet.user_id}, Currency: ${wallet.currency}, Balance: ₦${wallet.balance}`);
      });
    } else {
      console.log('❌ No wallets found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAllTransactions(); 