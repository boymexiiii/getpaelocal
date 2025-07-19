import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function verifyFlutterwaveSignature(req: Request, secret: string): boolean {
  // Flutterwave sends a 'verif-hash' header for webhook signature
  const signature = req.headers.get('verif-hash')
  return signature === secret
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const FLW_SECRET_HASH = Deno.env.get('FLUTTERWAVE_WEBHOOK_SECRET_HASH') ?? ''

  try {
    // Verify webhook signature
    if (!verifyFlutterwaveSignature(req, FLW_SECRET_HASH)) {
      await supabase.from('webhook_logs').insert({
        provider: 'flutterwave',
        event: 'invalid_signature',
        payload: await req.text(),
        status: 'error',
        created_at: new Date().toISOString()
      })
      return new Response('Invalid signature', { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const event = body.event
    const data = body.data

    // Log all events
    await supabase.from('webhook_logs').insert({
      provider: 'flutterwave',
      event,
      payload: JSON.stringify(body),
      status: 'received',
      created_at: new Date().toISOString()
    })

    // Only handle successful charge events
    if (event === 'charge.completed' && data.status === 'successful') {
      const txRef = data.tx_ref
      const userId = data.meta?.userId
      const amount = data.amount

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('currency', 'NGN')
        .single()

      if (walletError || !wallet) {
        await supabase.from('webhook_logs').insert({
          provider: 'flutterwave',
          event: 'wallet_not_found',
          payload: JSON.stringify({ userId, txRef }),
          status: 'error',
          created_at: new Date().toISOString()
        })
        return new Response('Wallet not found', { status: 400, headers: corsHeaders })
      }

      // Check if transaction already completed (idempotency)
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('*')
        .eq('reference', txRef)
        .eq('status', 'completed')
        .single()

      if (!existingTx) {
        // Update wallet balance
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + amount })
          .eq('id', wallet.id)

        // Update transaction status
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('reference', txRef)
      }
    }

    return new Response('Webhook processed', { status: 200, headers: corsHeaders })
  } catch (error) {
    await supabase.from('webhook_logs').insert({
      provider: 'flutterwave',
      event: 'webhook_error',
      payload: JSON.stringify({ error: error.message }),
      status: 'error',
      created_at: new Date().toISOString()
    })
    return new Response('Webhook error', { status: 500, headers: corsHeaders })
  }
}) 