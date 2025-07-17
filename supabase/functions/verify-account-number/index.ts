
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { bank_code, account_number } = await req.json()

    if (!bank_code || !account_number) {
      return new Response(
        JSON.stringify({ error: 'Bank code and account number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate account number format (10 digits)
    if (!/^\d{10}$/.test(account_number)) {
      return new Response(
        JSON.stringify({ error: 'Account number must be 10 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Account verification service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify account using Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    const verifyData = await verifyResponse.json()
    console.log('Paystack account verification response:', verifyData)

    if (!verifyResponse.ok || !verifyData.status) {
      return new Response(
        JSON.stringify({ 
          error: 'Account verification failed', 
          details: verifyData.message || 'Invalid account details'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          account_number: verifyData.data.account_number,
          account_name: verifyData.data.account_name,
          bank_code: bank_code
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Account verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
