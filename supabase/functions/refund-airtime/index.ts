import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Searching for 55 naira airtime transactions...');
    
    // Find the recent 55 naira bill payment transaction
    const { data: transactions, error } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('amount', 55)
      .eq('transaction_type', 'bill_payment')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }

    if (!transactions || transactions.length === 0) {
      throw new Error('No 55 naira bill payment transactions found');
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
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single();

    if (walletError || !wallet) {
      console.error('❌ User wallet not found:', walletError);
      throw new Error('User wallet not found');
    }

    console.log('💰 Current wallet balance:', wallet.balance);

    // Process refund
    const newBalance = wallet.balance + transaction.amount;
    
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('❌ Error updating wallet:', updateError);
      throw new Error('Failed to update wallet balance');
    }

    // Update transaction status to refunded
    const { error: txUpdateError } = await supabaseClient
      .from('transactions')
      .update({ 
        status: 'refunded',
        description: transaction.description + ' (REFUNDED - Airtime not delivered)'
      })
      .eq('id', transaction.id);

    if (txUpdateError) {
      console.error('❌ Error updating transaction:', txUpdateError);
      throw new Error('Failed to update transaction status');
    }

    // Create refund transaction record
    const { error: refundTxError } = await supabaseClient
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
      throw new Error('Failed to create refund transaction');
    }

    console.log('✅ Refund processed successfully!');
    console.log('💰 New wallet balance:', newBalance);
    console.log('📋 Transaction updated to refunded');
    console.log('📋 Refund transaction created');

    // Send notification to user
    try {
      await supabaseClient.functions.invoke('send-real-time-notification', {
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Refund processed successfully',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: 'refunded',
          reference: transaction.reference
        },
        wallet: {
          oldBalance: wallet.balance,
          newBalance: newBalance
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error: any) {
    console.error('❌ Refund error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Refund failed' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}) 