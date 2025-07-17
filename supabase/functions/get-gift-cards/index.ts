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
    console.log('Fetching available gift cards from Reloadly')

    // Get Reloadly access token
    const tokenResponse = await fetch('https://auth.reloadly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: Deno.env.get('RELOADLY_CLIENT_ID'),
        client_secret: Deno.env.get('RELOADLY_CLIENT_SECRET'),
        grant_type: 'client_credentials',
        audience: 'https://giftcards.reloadly.com'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to authenticate with Reloadly')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get gift card products
    const productsResponse = await fetch('https://giftcards.reloadly.com/products?size=50&page=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!productsResponse.ok) {
      throw new Error('Failed to fetch gift card products')
    }

    const productsData = await productsResponse.json()
    
    // Filter for popular brands
    const popularBrands = ['Amazon', 'Netflix', 'iTunes', 'Google Play', 'Spotify', 'Xbox', 'PlayStation']
    const filteredProducts = productsData.content?.filter((product: any) => 
      popularBrands.some(brand => 
        product.productName.toLowerCase().includes(brand.toLowerCase())
      )
    ) || []

    console.log(`Retrieved ${filteredProducts.length} gift card products`)

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredProducts.map((product: any) => ({
          id: product.productId,
          name: product.productName,
          brand: product.brand?.brandName || 'Unknown',
          country: product.country?.name || 'Global',
          denominations: product.fixedRecipientDenominations || [],
          minPrice: product.minRecipientDenomination,
          maxPrice: product.maxRecipientDenomination,
          logoUrl: product.logoUrls?.[0] || null,
          description: product.description || '',
          currency: product.recipientCurrencyCode || 'USD'
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Get gift cards error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gift cards' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})