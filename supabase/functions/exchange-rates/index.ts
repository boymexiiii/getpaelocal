import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExchangeRateResponse {
  success: boolean;
  rates?: {
    [currency: string]: number;
  };
  base?: string;
  timestamp?: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const baseCurrency = url.searchParams.get('base') || 'NGN'
    const targetCurrencies = url.searchParams.get('symbols') || 'USD,EUR,GBP'

    // Use multiple providers for redundancy
    let exchangeData: any = null;
    let error: string | null = null;

    // Try ExchangeRate-API first (free tier available)
    try {
      const apiKey = Deno.env.get('EXCHANGE_RATE_API_KEY')
      if (apiKey) {
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
        )
        const data = await response.json()
        
        if (data.result === 'success') {
          exchangeData = {
            base: baseCurrency,
            rates: data.conversion_rates,
            timestamp: data.time_last_update_unix
          }
        }
      }
    } catch (e) {
      console.log('ExchangeRate-API failed:', e)
    }

    // Fallback to Fixer.io
    if (!exchangeData) {
      try {
        const fixerApiKey = Deno.env.get('FIXER_API_KEY')
        if (fixerApiKey) {
          const response = await fetch(
            `https://api.fixer.io/latest?access_key=${fixerApiKey}&base=${baseCurrency}&symbols=${targetCurrencies}`
          )
          const data = await response.json()
          
          if (data.success) {
            exchangeData = {
              base: data.base,
              rates: data.rates,
              timestamp: data.timestamp
            }
          }
        }
      } catch (e) {
        console.log('Fixer.io failed:', e)
      }
    }

    // Fallback to free exchange rate API
    if (!exchangeData) {
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
        )
        const data = await response.json()
        
        exchangeData = {
          base: data.base,
          rates: data.rates,
          timestamp: Math.floor(Date.now() / 1000)
        }
      } catch (e) {
        error = 'All exchange rate providers failed'
        console.log('Free API failed:', e)
      }
    }

    if (!exchangeData) {
      throw new Error(error || 'Failed to fetch exchange rates')
    }

    // Filter rates to only requested currencies
    const requestedCurrencies = targetCurrencies.split(',')
    const filteredRates: { [key: string]: number } = {}
    
    for (const currency of requestedCurrencies) {
      if (exchangeData.rates[currency]) {
        filteredRates[currency] = exchangeData.rates[currency]
      }
    }

    const result: ExchangeRateResponse = {
      success: true,
      base: exchangeData.base,
      rates: filteredRates,
      timestamp: exchangeData.timestamp
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error: any) {
    console.error('Exchange rate error:', error)
    
    const result: ExchangeRateResponse = {
      success: false,
      error: error.message || 'Failed to fetch exchange rates'
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})