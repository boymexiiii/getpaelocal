
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cardId, amount } = await req.json()

    const reloadlyClientId = Deno.env.get('RELOADLY_CLIENT_ID')
    const reloadlyClientSecret = Deno.env.get('RELOADLY_CLIENT_SECRET')

    if (!reloadlyClientId || !reloadlyClientSecret) {
      throw new Error('Reloadly API credentials not configured')
    }

    // Get access token
    const tokenResponse = await fetch('https://auth.reloadly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: reloadlyClientId,
        client_secret: reloadlyClientSecret,
        grant_type: 'client_credentials',
        audience: 'https://giftcards.reloadly.com'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    console.log(`Funding card ${cardId} with amount ${amount}`)
    
    // For demo purposes, we'll simulate successful funding
    // In production, integrate with actual Reloadly virtual card funding API
    const success = true; // Simulated success

    return new Response(
      JSON.stringify({ success: true }),
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
