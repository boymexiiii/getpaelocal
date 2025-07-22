import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Use environment variables for Supabase credentials (set in .env or deployment environment)
const supabaseUrl = process.env.SUPABASE_URL || 'https://rxnhnvshktykxhcjbgzm.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmhudnNodGt5a3hrY2piZ3ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ5NzI5NywiZXhwIjoyMDUzMDczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej';
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

    // Send notification to user
    try {
      await supabase.functions.invoke('send-real-time-notification', {
        body: {
          userId: transaction.user_id,
          title: 'Payment Refunded',
          message: `Your ₦${transaction.amount} airtime payment has been refunded because the airtime was not delivered.`,
          type: 'info'
        }
      });
      console.log('📱 Notification sent to user');
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the refund
refundAirtimePayment(); 