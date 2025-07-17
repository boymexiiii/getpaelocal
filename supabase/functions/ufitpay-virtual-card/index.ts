import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CardRequest {
  action: 'create' | 'fund' | 'freeze' | 'unfreeze' | 'details';
  amount?: number;
  currency?: string;
  cardholderName?: string;
  cardId?: string;
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
      action,
      amount,
      currency = 'USD',
      cardholderName,
      cardId,
      userId
    }: CardRequest = await req.json()

    console.log('Processing UfitPay virtual card request:', {
      action,
      amount,
      currency,
      userId
    })

    // Get UfitPay credentials
    const ufitpayApiKey = Deno.env.get('UFITPAY_API_KEY')
    const ufitpaySecretKey = Deno.env.get('UFITPAY_SECRET_KEY')

    if (!ufitpayApiKey || !ufitpaySecretKey) {
      throw new Error('UfitPay API credentials not configured')
    }

    const baseUrl = 'https://api.ufitpay.com/v1'
    const headers = {
      'Authorization': `Bearer ${ufitpayApiKey}`,
      'Content-Type': 'application/json',
      'X-Secret-Key': ufitpaySecretKey
    }

    let response: any

    switch (action) {
      case 'create': {
        if (!amount || !cardholderName) {
          throw new Error('Amount and cardholder name are required for card creation')
        }

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

        // Create virtual card with UfitPay
        const createResponse = await fetch(`${baseUrl}/cards`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount,
            currency,
            cardholder_name: cardholderName,
            card_type: 'virtual'
          })
        })

        const createData = await createResponse.json()

        if (!createResponse.ok) {
          throw new Error(createData.message || 'Card creation failed')
        }

        // Update wallet balance
        const { error: updateError } = await supabaseClient
          .from('wallets')
          .update({ balance: wallet.balance - deductAmount })
          .eq('id', wallet.id)

        if (updateError) {
          throw new Error('Failed to update wallet balance')
        }

        // Store card in database
        const { data: cardRecord, error: cardError } = await supabaseClient
          .from('virtual_cards')
          .insert({
            user_id: userId,
            reloadly_card_id: createData.card_id,
            card_number: createData.card_number,
            cvv: createData.cvv,
            expiry_month: createData.expiry_month,
            expiry_year: createData.expiry_year,
            cardholder_name: cardholderName,
            balance: amount,
            currency,
            status: 'active'
          })
          .select()
          .single()

        if (cardError) {
          throw new Error('Failed to store card record')
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

        response = {
          success: true,
          data: {
            cardId: createData.card_id,
            cardNumber: createData.card_number,
            cvv: createData.cvv,
            expiryMonth: createData.expiry_month,
            expiryYear: createData.expiry_year,
            balance: amount,
            currency,
            status: 'active'
          }
        }
        break
      }

      case 'fund': {
        if (!cardId || !amount) {
          throw new Error('Card ID and amount are required for funding')
        }

        const fundResponse = await fetch(`${baseUrl}/cards/${cardId}/fund`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount, currency })
        })

        const fundData = await fundResponse.json()

        if (!fundResponse.ok) {
          throw new Error(fundData.message || 'Card funding failed')
        }

        // Update card balance in database
        await supabaseClient
          .from('virtual_cards')
          .update({ balance: fundData.new_balance })
          .eq('reloadly_card_id', cardId)
          .eq('user_id', userId)

        response = {
          success: true,
          data: {
            cardId,
            newBalance: fundData.new_balance,
            fundedAmount: amount
          }
        }
        break
      }

      case 'freeze': {
        if (!cardId) {
          throw new Error('Card ID is required for freezing')
        }

        const freezeResponse = await fetch(`${baseUrl}/cards/${cardId}/freeze`, {
          method: 'POST',
          headers
        })

        const freezeData = await freezeResponse.json()

        if (!freezeResponse.ok) {
          throw new Error(freezeData.message || 'Card freezing failed')
        }

        // Update card status in database
        await supabaseClient
          .from('virtual_cards')
          .update({ status: 'frozen' })
          .eq('reloadly_card_id', cardId)
          .eq('user_id', userId)

        response = {
          success: true,
          message: 'Card frozen successfully'
        }
        break
      }

      case 'unfreeze': {
        if (!cardId) {
          throw new Error('Card ID is required for unfreezing')
        }

        const unfreezeResponse = await fetch(`${baseUrl}/cards/${cardId}/unfreeze`, {
          method: 'POST',
          headers
        })

        const unfreezeData = await unfreezeResponse.json()

        if (!unfreezeResponse.ok) {
          throw new Error(unfreezeData.message || 'Card unfreezing failed')
        }

        // Update card status in database
        await supabaseClient
          .from('virtual_cards')
          .update({ status: 'active' })
          .eq('reloadly_card_id', cardId)
          .eq('user_id', userId)

        response = {
          success: true,
          message: 'Card unfrozen successfully'
        }
        break
      }

      case 'details': {
        if (!cardId) {
          throw new Error('Card ID is required for details')
        }

        const detailsResponse = await fetch(`${baseUrl}/cards/${cardId}`, {
          method: 'GET',
          headers
        })

        const detailsData = await detailsResponse.json()

        if (!detailsResponse.ok) {
          throw new Error(detailsData.message || 'Failed to get card details')
        }

        response = {
          success: true,
          data: detailsData
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
    console.error('UfitPay virtual card error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Virtual card operation failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})