import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the frontend
const supabaseUrl = 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNoa3R5a3hoY2piZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzMwMTksImV4cCI6MjA2NjUwOTAxOX0.RV42GZbBYIrf6Qyyn0Q7aRlmTu2exgQtDaQtO46RV_4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
  try {
    console.log('🔍 Checking all bill payment transactions...');
    
    // Find all bill payment transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_type', 'bill_payment')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      return;
    }

    if (!transactions || transactions.length === 0) {
      console.log('❌ No bill payment transactions found');
      return;
    }

    console.log(`📋 Found ${transactions.length} bill payment transactions:`);
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Amount: ₦${tx.amount}, Status: ${tx.status}, Reference: ${tx.reference}, Created: ${tx.created_at}`);
    });

    // Also check for any airtime-related transactions
    console.log('\n🔍 Checking for airtime-related transactions...');
    
    const { data: airtimeTransactions, error: airtimeError } = await supabase
      .from('transactions')
      .select('*')
      .ilike('description', '%airtime%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (airtimeError) {
      console.error('❌ Error fetching airtime transactions:', airtimeError);
      return;
    }

    if (airtimeTransactions && airtimeTransactions.length > 0) {
      console.log(`📱 Found ${airtimeTransactions.length} airtime-related transactions:`);
      
      airtimeTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. Amount: ₦${tx.amount}, Status: ${tx.status}, Description: ${tx.description}, Created: ${tx.created_at}`);
      });
    } else {
      console.log('❌ No airtime-related transactions found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkTransactions(); 