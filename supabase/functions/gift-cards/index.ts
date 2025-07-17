import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GiftCardPurchaseRequest {
  productId: number;
  unitPrice: number;
  quantity: number;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  customMessage?: string;
  userId: string;
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
      productId,
      unitPrice,
      quantity,
      senderName,
      recipientEmail,
      recipientName,
      customMessage,
      userId
    }: GiftCardPurchaseRequest = await req.json()

    console.log('Processing gift card purchase:', {
      productId,
      unitPrice,
      quantity,
      userId
    })

    // Check user's NGN wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      throw new Error('User wallet not found')
    }

    const totalAmount = unitPrice * quantity
    if (wallet.balance < totalAmount) {
      throw new Error('Insufficient balance for this purchase')
    }

    // Get Reloadly access token
    const tokenResponse = await fetch('https://auth.reloadly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: Deno.env.get('RELOADLY_CLIENT_ID'),
        client_secret: Deno.env.get('RELOADLY_CLIENT_SECRET'),
        grant_type: 'client_credentials',
        audience: 'https://giftcards.reloadly.com'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to authenticate with Reloadly')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Purchase gift card
    const purchaseResponse = await fetch('https://giftcards.reloadly.com/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId,
        unitPrice,
        quantity,
        senderName,
        recipientEmail,
        recipientName,
        customMessage: customMessage || `Gift card from ${senderName}`
      })
    })

    if (!purchaseResponse.ok) {
      const errorData = await purchaseResponse.json()
      throw new Error(`Gift card purchase failed: ${errorData.message || 'Unknown error'}`)
    }

    const purchaseData = await purchaseResponse.json()

    // Update wallet balance
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - totalAmount })
      .eq('id', wallet.id)

    if (updateError) {
      console.error('Failed to update wallet balance:', updateError)
      throw new Error('Failed to update wallet balance')
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'gift_card',
        amount: totalAmount,
        currency: 'NGN',
        description: `Gift card purchase - ${purchaseData.productName || 'Gift Card'}`,
        status: 'completed',
        reference: `GC-${purchaseData.transactionId || Date.now()}`
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
    }

    console.log('Gift card purchase completed:', purchaseData.transactionId)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gift card purchased successfully',
        data: {
          transactionId: purchaseData.transactionId,
          productName: purchaseData.productName,
          amount: totalAmount,
          recipientEmail,
          status: purchaseData.status
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Gift card purchase error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Gift card purchase failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})