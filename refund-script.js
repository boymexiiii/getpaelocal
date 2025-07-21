import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the frontend
const supabaseUrl = 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNoa3R5a3hoY2piZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzMwMTksImV4cCI6MjA2NjUwOTAxOX0.RV42GZbBYIrf6Qyyn0Q7aRlmTu2exgQtDaQtO46RV_4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function refundAirtimePayment() {
  try {
    console.log('🔍 Searching for 55 naira airtime transactions...');
    
    // Find the recent 55 naira bill payment transaction
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('amount', 55)
      .eq('transaction_type', 'bill_payment')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      return;
    }

    if (!transactions || transactions.length === 0) {
      console.log('❌ No 55 naira bill payment transactions found');
      return;
    }

    const transaction = transactions[0];
    console.log('📋 Found transaction:', {
      id: transaction.id,
      user_id: transaction.user_id,
      amount: transaction.amount,
      status: transaction.status,
      reference: transaction.reference,
      created_at: transaction.created_at
    });

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single();

    if (walletError || !wallet) {
      console.error('❌ User wallet not found:', walletError);
      return;
    }

    console.log('💰 Current wallet balance:', wallet.balance);

    // Process refund
    const newBalance = wallet.balance + transaction.amount;
    
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('❌ Error updating wallet:', updateError);
      return;
    }

    // Update transaction status to refunded
    const { error: txUpdateError } = await supabase
      .from('transactions')
      .update({ 
        status: 'refunded',
        description: transaction.description + ' (REFUNDED - Airtime not delivered)'
      })
      .eq('id', transaction.id);

    if (txUpdateError) {
      console.error('❌ Error updating transaction:', txUpdateError);
      return;
    }

    // Create refund transaction record
    const { error: refundTxError } = await supabase
      .from('transactions')
      .insert({
        user_id: transaction.user_id,
        transaction_type: 'refund',
        amount: transaction.amount,
        currency: 'NGN',
        description: `Refund for failed airtime payment - ${transaction.reference}`,
        status: 'completed',
        reference: `REFUND_${transaction.reference}`,
        recipient_id: null
      });

    if (refundTxError) {
      console.error('❌ Error creating refund transaction:', refundTxError);
      return;
    }

    console.log('✅ Refund processed successfully!');
    console.log('💰 New wallet balance:', newBalance);
    console.log('📋 Transaction updated to refunded');
    console.log('📋 Refund transaction created');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the refund
refundAirtimePayment(); 