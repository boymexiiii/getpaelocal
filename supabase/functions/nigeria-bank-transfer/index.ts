import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BankTransferRequest {
  bank_code: string;
  account_number: string;
  account_name: string;
  amount: number;
  narration: string;
  user_id: string;
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

    const {
      bank_code,
      account_number,
      account_name,
      amount,
      narration,
      user_id
    }: BankTransferRequest = await req.json()

    console.log('Processing Nigeria bank transfer:', {
      bank_code,
      account_number,
      account_name,
      amount,
      user_id
    })

    // Validate required fields
    if (!bank_code || !account_number || !account_name || !amount || !user_id) {
      throw new Error('Missing required fields for bank transfer')
    }

    // Check user's NGN wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      throw new Error('User wallet not found')
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance for this transfer')
    }

    // Check transaction limits
    const { data: limits, error: limitsError } = await supabaseClient
      .from('transaction_limits')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (limitsError || !limits) {
      throw new Error('Transaction limits not found')
    }

    // Check daily send limit
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTransactions, error: txError } = await supabaseClient
      .from('transactions')
      .select('amount')
      .eq('user_id', user_id)
      .eq('transaction_type', 'bank_transfer')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)

    if (txError) {
      console.error('Error fetching today transactions:', txError)
    }

    const todayTotal = (todayTransactions || []).reduce((sum, tx) => sum + Number(tx.amount), 0)
    
    if (limits.daily_send_limit && (todayTotal + amount) > limits.daily_send_limit) {
      throw new Error(`Transfer amount exceeds daily limit of ₦${limits.daily_send_limit.toLocaleString()}`)
    }

    // Generate unique reference
    const reference = `NBT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // For demo purposes, we'll simulate a successful transfer
    // In production, integrate with Nigerian payment providers like Paystack, Flutterwave, or direct bank APIs
    const transferSuccess = true // Simulated success

    if (!transferSuccess) {
      throw new Error('Bank transfer failed. Please try again.')
    }

    // Update wallet balance
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id)

    if (updateError) {
      throw new Error('Failed to update wallet balance')
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id,
        transaction_type: 'bank_transfer',
        amount,
        currency: 'NGN',
        description: `Bank transfer to ${account_name} (${account_number}) - ${narration}`,
        status: 'completed',
        reference,
        recipient_id: null
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      throw new Error('Failed to create transaction record')
    }

    console.log('Bank transfer completed successfully:', {
      reference,
      amount,
      account_name
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `₦${amount.toLocaleString()} transferred successfully to ${account_name}`,
        data: {
          reference,
          amount,
          account_name,
          account_number,
          bank_code,
          transaction_id: transaction.id,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Nigeria bank transfer error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed. Please try again.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})