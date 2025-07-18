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

    const { recipientName, bank, accountNumber, amount, country } = await req.json()
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')

    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured')
    }

    const txRef = `PAE-REMIT-${Date.now()}`

    // Initiate transfer via Flutterwave
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: bank,
        account_number: accountNumber,
        amount,
        currency: 'NGN',
        beneficiary_name: recipientName,
        reference: txRef,
        narration: 'Remittance via PaePros',
      })
    })

    const data = await response.json()

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to initiate remittance')
    }

    // Store remittance transaction
    await supabase
      .from('transactions')
      .insert({
        transaction_type: 'remittance',
        amount,
        description: 'Flutterwave remittance',
        status: 'pending',
        reference: txRef,
        recipient_name: recipientName,
        recipient_bank: bank,
        recipient_account: accountNumber,
        country,
      })

    return new Response(
      JSON.stringify({
        success: true,
        reference: txRef,
        data: data.data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Flutterwave remittance error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 