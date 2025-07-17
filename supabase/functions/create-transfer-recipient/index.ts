import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateRecipientRequest {
  type: 'nuban';
  name: string;
  account_number: string;
  bank_code: string;
  currency: 'NGN';
  user_id: string;
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
      name,
      account_number,
      bank_code,
      user_id
    }: CreateRecipientRequest = await req.json()

    console.log('Creating transfer recipient:', {
      name,
      account_number,
      bank_code,
      user_id
    })

    // Validate required fields
    if (!name || !account_number || !bank_code || !user_id) {
      throw new Error('Missing required fields for recipient creation')
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Create recipient with Paystack
    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name,
        account_number,
        bank_code,
        currency: 'NGN'
      })
    })

    const data = await response.json()
    console.log('Paystack recipient response:', data)

    if (!data.status) {
      throw new Error(`Failed to create recipient: ${data.message}`)
    }

    // Store recipient in database for future use
    const { error: dbError } = await supabaseClient
      .from('bank_accounts')
      .upsert({
        user_id,
        account_name: name,
        account_number,
        bank_code,
        bank_name: data.data.details?.bank_name || 'Unknown Bank',
        is_verified: true
      }, {
        onConflict: 'user_id,account_number,bank_code'
      })

    if (dbError) {
      console.error('Error storing bank account:', dbError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          recipient_code: data.data.recipient_code,
          account_name: name,
          account_number,
          bank_code,
          bank_name: data.data.details?.bank_name,
          created_at: data.data.createdAt
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Create recipient error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create recipient' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})