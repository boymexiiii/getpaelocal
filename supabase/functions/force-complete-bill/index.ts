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

    // Find the bill transaction
    let { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq(transactionId ? 'id' : 'reference', transactionId || reference)
      .eq('transaction_type', 'bill_payment')
      .single()

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: 'Bill transaction not found' }), { status: 404, headers: corsHeaders })
    }
    if (tx.status === 'completed') {
      return new Response(JSON.stringify({ success: true, message: 'Bill already completed' }), { headers: corsHeaders })
    }
    if (tx.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Bill is not pending' }), { status: 400, headers: corsHeaders })
    }

    // Update bill transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', tx.id)

    // Optionally, credit wallet if your logic requires refund on force-complete
    // await supabase
    //   .from('wallets')
    //   .update({ balance: wallet.balance + tx.amount })
    //   .eq('id', wallet.id)

    return new Response(JSON.stringify({ success: true, message: 'Bill marked as completed.' }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 