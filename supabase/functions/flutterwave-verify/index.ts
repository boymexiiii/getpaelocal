
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

    const { transactionId } = await req.json()
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')

    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured')
    }

    // Verify transaction with Flutterwave
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
      }
    })

    const data = await response.json()

    if (!data.status || data.data.status !== 'successful') {
      throw new Error('Payment verification failed')
    }

    const userId = data.data.meta.userId
    const amount = data.data.amount

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found:', walletError)
      throw new Error('Wallet not found')
    }

    // Check if transaction already completed (idempotency)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', data.data.tx_ref)
      .eq('status', 'completed')
      .single()

    if (!existingTx) {
    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount })
      .eq('id', wallet.id)

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('reference', data.data.tx_ref)
    } else {
      console.log('Transaction already completed for reference:', data.data.tx_ref)
    }

    try {
      await supabase.functions.invoke('send-real-time-notification', {
        body: {
          userId: userId,
          type: 'wallet_funded',
          title: 'Wallet Funded',
          message: `Your wallet has been funded with ₦${amount.toLocaleString()}`,
          channels: ['push', 'email']
        }
      });
    } catch (notifError) {
      console.error('Failed to send wallet funding notification:', notifError);
    }

    return new Response(
      JSON.stringify({ success: true, amount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Flutterwave verify error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
