
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { amount, paymentMethod, userId } = await req.json()

    console.log('Add money request:', { amount, paymentMethod, userId })

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet error:', walletError)
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Simulate payment processing based on method
    let paymentStatus = 'completed'
    let paymentReference = `FUND-${paymentMethod.toUpperCase()}-${Date.now()}`

    // In a real implementation, you would integrate with actual payment providers
    // For now, we'll simulate successful payments
    console.log(`Processing ${paymentMethod} payment of ${amount}`)

    // Create funding transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'wallet_funded',
        amount,
        description: `Wallet funding via ${paymentMethod}`,
        status: paymentStatus,
        reference: paymentReference
      })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount })
      .eq('id', wallet.id)

    if (updateError) {
      console.error('Wallet update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update wallet balance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reference: paymentReference,
        message: `Successfully added ${amount} to wallet via ${paymentMethod}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Add money error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
