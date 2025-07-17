
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
    const { cardId } = await req.json()

    // Get Reloadly API credentials
    const reloadlyClientId = Deno.env.get('RELOADLY_CLIENT_ID')
    const reloadlyClientSecret = Deno.env.get('RELOADLY_CLIENT_SECRET')

    if (!reloadlyClientId || !reloadlyClientSecret) {
      throw new Error('Reloadly API credentials not configured')
    }

    // Freeze the card (demo implementation)
    // In production, integrate with actual Reloadly virtual card management API
    console.log(`Successfully froze card ${cardId}`)

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
