
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

    const { amount, email, userId, name } = await req.json()
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')

    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured')
    }

    const txRef = `PAE-FLW-${userId}-${Date.now()}`

    // Initialize Flutterwave transaction
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: 'NGN',
        redirect_url: `${req.headers.get('origin')}/fund?status=success`,
        customer: {
          email,
          name: name || 'User',
        },
        customizations: {
          title: 'Pae Wallet Funding',
          description: 'Fund your Pae wallet',
        },
        meta: {
          userId
        }
      })
    })

    const data = await response.json()

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to initialize payment')
    }

    // Store pending transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'deposit',
        amount,
        description: 'Flutterwave wallet funding',
        status: 'pending',
        reference: txRef
      })

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: data.data.link,
        reference: txRef
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Flutterwave initialize error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
