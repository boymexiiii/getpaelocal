import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { bankCode, accountNumber, accountName, amount, narration, userId } = await req.json()
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')

    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured')
    }

    // Get sender's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      throw new Error('Wallet not found')
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance')
    }

    // Initiate transfer with Flutterwave
    const payoutResponse = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: accountNumber,
        amount,
        narration: narration || 'Pae bank transfer',
        currency: 'NGN',
        beneficiary_name: accountName,
        reference: `PAE-FLW-BANK-${userId}-${Date.now()}`
      })
    })

    const payoutData = await payoutResponse.json()

    if (payoutData.status !== 'success') {
      throw new Error(payoutData.message || 'Flutterwave transfer failed')
    }

    // Deduct from sender's wallet
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id)

    // Log transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'bank_transfer',
        amount,
        description: narration || 'Bank transfer',
        status: 'completed',
        reference: payoutData.data.reference
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Transfer successful', data: payoutData.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Flutterwave bank transfer error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 