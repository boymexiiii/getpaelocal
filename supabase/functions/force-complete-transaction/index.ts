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
    const { transactionId, reference } = await req.json()
    if (!transactionId && !reference) {
      return new Response(JSON.stringify({ error: 'transactionId or reference required' }), { status: 400, headers: corsHeaders })
    }

    // Find the transaction
    let { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq(transactionId ? 'id' : 'reference', transactionId || reference)
      .single()

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: corsHeaders })
    }
    if (tx.status === 'completed') {
      return new Response(JSON.stringify({ success: true, message: 'Transaction already completed' }), { headers: corsHeaders })
    }
    if (tx.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Transaction is not pending' }), { status: 400, headers: corsHeaders })
    }

    // Get the user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', tx.user_id)
      .eq('currency', 'NGN')
      .single()
    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found' }), { status: 404, headers: corsHeaders })
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', tx.id)

    // Credit the wallet
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + tx.amount })
      .eq('id', wallet.id)

    return new Response(JSON.stringify({ success: true, message: 'Transaction completed and wallet credited.' }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 