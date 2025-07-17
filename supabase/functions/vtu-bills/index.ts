import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VTUBillRequest {
  billType: 'airtime' | 'data' | 'electricity';
  serviceId: string;
  amount: number;
  phone?: string;
  meterNumber?: string;
  dataPlan?: string;
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
      billType,
      serviceId,
      amount,
      phone,
      meterNumber,
      dataPlan,
      userId
    }: VTUBillRequest = await req.json()

    console.log('Processing VTU bill payment:', {
      billType,
      serviceId,
      amount,
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

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance for this bill payment')
    }

    // Get VTU credentials
    const vtuApiKey = Deno.env.get('VTU_API_KEY')
    const vtuSecretKey = Deno.env.get('VTU_SECRET_KEY')

    if (!vtuApiKey || !vtuSecretKey) {
      throw new Error('VTU API credentials not configured')
    }

    // Generate unique request ID
    const requestId = `VTU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    let endpoint = ''
    let payload: any = {
      request_id: requestId,
      serviceID: serviceId,
      amount: amount
    }

    // Set endpoint and payload based on bill type
    switch (billType) {
      case 'airtime':
        endpoint = 'https://vtu.ng/wp-json/api/v1/airtime'
        payload.phone = phone
        break
      case 'data':
        endpoint = 'https://vtu.ng/wp-json/api/v1/data'
        payload.phone = phone
        payload.plan = dataPlan
        break
      case 'electricity':
        endpoint = 'https://vtu.ng/wp-json/api/v1/electricity'
        payload.billersCode = meterNumber
        break
      default:
        throw new Error('Invalid bill type')
    }

    // Make VTU API request
    const vtuResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${vtuApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const vtuData = await vtuResponse.json()

    if (!vtuResponse.ok || vtuData.code !== '000') {
      throw new Error(vtuData.message || 'Bill payment failed')
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
        user_id: userId,
        transaction_type: 'bill_payment',
        amount,
        currency: 'NGN',
        description: `${billType.toUpperCase()} payment - ${serviceId} - ${phone || meterNumber}`,
        status: 'completed',
        reference: requestId,
        recipient_id: null
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      throw new Error('Failed to create transaction record')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${billType.toUpperCase()} payment of ₦${amount.toLocaleString()} completed successfully`,
        data: {
          requestId,
          amount,
          billType,
          serviceId,
          phone: phone || null,
          meterNumber: meterNumber || null,
          transactionId: transaction.id,
          vtuReference: vtuData.data?.reference || requestId,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('VTU bill payment error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Bill payment failed. Please try again.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})