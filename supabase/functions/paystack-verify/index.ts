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

    const { reference } = await req.json()
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      }
    })

    const data = await response.json()

    if (!data.status || data.data.status !== 'success') {
      throw new Error('Payment verification failed')
    }

    const userId = data.data.metadata.userId
    const amount = data.data.amount / 100 // Convert from kobo

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      throw new Error('Wallet not found')
    }

    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount })
      .eq('id', wallet.id)

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('reference', reference)

    return new Response(
      JSON.stringify({ success: true, amount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Paystack verify error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})