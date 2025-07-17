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

    const { amount, email, userId } = await req.json()
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        reference: `PAE-${userId}-${Date.now()}`,
        callback_url: `${req.headers.get('origin')}/fund?status=success`,
        metadata: {
          userId,
          custom_fields: [
            {
              display_name: "Purpose",
              variable_name: 'purpose',
              value: 'Wallet Funding'
            }
          ]
        }
      })
    })

    const data = await response.json()

    if (!data.status) {
      throw new Error(data.message || 'Failed to initialize payment')
    }

    // Store pending transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'deposit',
        amount,
        description: 'Paystack wallet funding',
        status: 'pending',
        reference: data.data.reference
      })

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: data.data.authorization_url,
        reference: data.data.reference
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Paystack initialize error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})