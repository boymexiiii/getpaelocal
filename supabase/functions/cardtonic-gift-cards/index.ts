import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GiftCardRequest {
  action: 'list' | 'purchase';
  productId?: string;
  amount?: number;
  quantity?: number;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  customMessage?: string;
  userId?: string;
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
      action,
      productId,
      amount,
      quantity = 1,
      recipientEmail,
      recipientName,
      senderName,
      customMessage,
      userId
    }: GiftCardRequest = await req.json()

    console.log('Processing Cardtonic gift card request:', {
      action,
      productId,
      amount,
      userId
    })

    // Get Cardtonic credentials
    const cardtonicApiKey = Deno.env.get('CARDTONIC_API_KEY')
    const cardtonicSecretKey = Deno.env.get('CARDTONIC_SECRET_KEY')

    if (!cardtonicApiKey || !cardtonicSecretKey) {
      throw new Error('Cardtonic API credentials not configured')
    }

    const baseUrl = 'https://api.cardtonic.com/v2'
    const headers = {
      'Authorization': `Bearer ${cardtonicApiKey}`,
      'Content-Type': 'application/json',
      'X-API-Key': cardtonicSecretKey
    }

    let response: any

    switch (action) {
      case 'list': {
        // Get available gift cards
        const listResponse = await fetch(`${baseUrl}/giftcards`, {
          method: 'GET',
          headers
        })

        const listData = await listResponse.json()

        if (!listResponse.ok) {
          throw new Error(listData.message || 'Failed to fetch gift cards')
        }

        // Filter for popular brands
        const popularBrands = ['Amazon', 'Netflix', 'iTunes', 'Google Play', 'Spotify', 'Xbox', 'PlayStation', 'Steam']
        const filteredProducts = listData.data?.filter((product: any) => 
          popularBrands.some(brand => 
            product.name.toLowerCase().includes(brand.toLowerCase())
          )
        ) || []

        response = {
          success: true,
          data: filteredProducts.map((product: any) => ({
            id: product.id,
            name: product.name,
            brand: product.brand || 'Unknown',
            country: product.country || 'Global',
            denominations: product.denominations || [],
            minPrice: product.min_amount,
            maxPrice: product.max_amount,
            logoUrl: product.logo_url || null,
            description: product.description || '',
            currency: product.currency || 'USD'
          }))
        }
        break
      }

      case 'purchase': {
        if (!productId || !amount || !userId || !recipientEmail || !recipientName || !senderName) {
          throw new Error('Missing required fields for gift card purchase')
        }

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

        const totalAmount = amount * quantity
        if (wallet.balance < totalAmount) {
          throw new Error('Insufficient balance for this purchase')
        }

        // Generate unique order ID
        const orderId = `CT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Purchase gift card
        const purchaseResponse = await fetch(`${baseUrl}/giftcards/purchase`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_id: productId,
            amount: amount,
            quantity: quantity,
            recipient_email: recipientEmail,
            recipient_name: recipientName,
            sender_name: senderName,
            message: customMessage || `Gift card from ${senderName}`,
            order_id: orderId
          })
        })

        const purchaseData = await purchaseResponse.json()

        if (!purchaseResponse.ok) {
          throw new Error(purchaseData.message || 'Gift card purchase failed')
        }

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
            description: `Gift card purchase - ${purchaseData.product_name || 'Gift Card'}`,
            status: 'completed',
            reference: orderId
          })

        if (transactionError) {
          console.error('Error creating transaction record:', transactionError)
        }

        response = {
          success: true,
          message: 'Gift card purchased successfully',
          data: {
            orderId: orderId,
            productName: purchaseData.product_name,
            amount: totalAmount,
            quantity,
            recipientEmail,
            status: purchaseData.status,
            cardCode: purchaseData.card_code,
            cardPin: purchaseData.card_pin,
            redemptionUrl: purchaseData.redemption_url
          }
        }
        break
      }

      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Cardtonic gift card error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Gift card operation failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})