import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnhancedBankTransferRequest {
  bank_code: string;
  account_number: string;
  amount: number;
  narration: string;
  user_id: string;
  provider: 'paystack' | 'flutterwave';
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
      amount,
      narration,
      user_id,
      provider = 'paystack'
    }: EnhancedBankTransferRequest = await req.json()

    console.log('Processing enhanced bank transfer:', {
      bank_code,
      account_number,
      amount,
      provider,
      user_id
    })

    // Validate required fields
    if (!bank_code || !account_number || !amount || !user_id) {
      throw new Error('Missing required fields for bank transfer')
    }

    // Verify account number first using the selected provider
    let accountName = '';
    
    if (provider === 'paystack') {
      // Verify account with Paystack
      const verifyResponse = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify account details')
      }

      const verifyData = await verifyResponse.json()
      if (!verifyData.status) {
        throw new Error('Invalid account number or bank code')
      }

      accountName = verifyData.data.account_name
    } else {
      // Verify account with Flutterwave
      const verifyResponse = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FLUTTERWAVE_SECRET_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_number,
          account_bank: bank_code
        })
      })

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify account details')
      }

      const verifyData = await verifyResponse.json()
      if (verifyData.status !== 'success') {
        throw new Error('Invalid account number or bank code')
      }

      accountName = verifyData.data.account_name
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
    const reference = `EBT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create transfer recipient first (required by Paystack)
    let recipientCode = '';
    
    if (provider === 'paystack') {
      // Create recipient with Paystack
      const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'nuban',
          name: accountName,
          account_number,
          bank_code,
          currency: 'NGN'
        })
      })

      const recipientData = await recipientResponse.json()
      if (!recipientData.status) {
        throw new Error(`Failed to create recipient: ${recipientData.message}`)
      }
      
      recipientCode = recipientData.data.recipient_code
      console.log('Created recipient:', recipientCode)
    }

    // Process transfer using selected provider
    let transferResult;
    
    if (provider === 'paystack') {
      // Initialize Paystack transfer with recipient code
      const transferResponse = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: 'balance',
          amount: amount * 100, // Paystack uses kobo
          recipient: recipientCode,
          reason: narration || 'Bank transfer',
          reference
        })
      })

      transferResult = await transferResponse.json()
      if (!transferResult.status) {
        throw new Error(`Transfer failed: ${transferResult.message}`)
      }
    } else {
      // Process Flutterwave transfer
      const transferResponse = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FLUTTERWAVE_SECRET_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_bank: bank_code,
          account_number,
          amount,
          narration: narration || 'Bank transfer',
          currency: 'NGN',
          reference,
          callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/transfer-callback`,
          debit_currency: 'NGN'
        })
      })

      transferResult = await transferResponse.json()
      if (transferResult.status !== 'success') {
        throw new Error(`Transfer failed: ${transferResult.message}`)
      }
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
        description: `Bank transfer to ${accountName} (${account_number}) - ${narration}`,
        status: 'processing',
        reference
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      throw new Error('Failed to create transaction record')
    }

    console.log('Enhanced bank transfer initiated:', {
      reference,
      amount,
      accountName,
      provider
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `₦${amount.toLocaleString()} transfer initiated to ${accountName}`,
        data: {
          reference,
          amount,
          account_name: accountName,
          account_number,
          bank_code,
          provider,
          transaction_id: transaction.id,
          status: 'processing',
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Enhanced bank transfer error:', error)
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