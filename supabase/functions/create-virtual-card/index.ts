
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
    const { amount, currency, cardholderName, userId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const reloadlyClientId = Deno.env.get('RELOADLY_CLIENT_ID')
    const reloadlyClientSecret = Deno.env.get('RELOADLY_CLIENT_SECRET')

    if (!reloadlyClientId || !reloadlyClientSecret) {
      throw new Error('Reloadly API credentials not configured')
    }

    // Get Reloadly access token for sandbox environment
    const tokenResponse = await fetch('https://auth.reloadly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: reloadlyClientId,
        client_secret: reloadlyClientSecret,
        grant_type: 'client_credentials',
        audience: 'https://giftcards-sandbox.reloadly.com'
      })
    })

    const tokenData = await tokenResponse.json()
    console.log('Token response:', tokenData)
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get Reloadly access token')
    }

    // For now, we'll create a demo virtual card since Reloadly virtual cards require special setup
    // In production, you would integrate with their actual virtual card API
    const cardData = {
      cardId: `RLD-${Date.now()}`,
      cardNumber: '4532' + Math.random().toString().slice(2, 14),
      cvv: Math.floor(Math.random() * 900 + 100).toString(),
      expiryMonth: String(Math.floor(Math.random() * 12) + 1).padStart(2, '0'),
      expiryYear: String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 1),
      balance: amount,
      currency: currency,
      status: 'active'
    }

    console.log('Created card data:', cardData)

    // Check and deduct from user's NGN wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      throw new Error('Failed to find user wallet')
    }

    const conversionRate = currency === 'USD' ? 1500 : currency === 'EUR' ? 1600 : 1800
    const deductAmount = amount * conversionRate

    if (wallet.balance < deductAmount) {
      throw new Error('Insufficient balance')
    }

    // Update wallet balance
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - deductAmount })
      .eq('id', wallet.id)

    if (updateError) {
      throw new Error('Failed to update wallet balance')
    }

    // Create transaction record
    await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'card_creation',
        amount: deductAmount,
        currency: 'NGN',
        description: `Virtual card creation - ${amount} ${currency}`,
        status: 'completed',
        reference: `CARD-${Date.now()}`
      })

    return new Response(
      JSON.stringify(cardData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
