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

    // Find the bank transfer transaction
    let { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq(transactionId ? 'id' : 'reference', transactionId || reference)
      .eq('transaction_type', 'bank_transfer')
      .single()

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: 'Bank transfer not found' }), { status: 404, headers: corsHeaders })
    }
    if (tx.status === 'completed') {
      return new Response(JSON.stringify({ success: true, message: 'Bank transfer already completed' }), { headers: corsHeaders })
    }
    if (tx.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Bank transfer is not pending' }), { status: 400, headers: corsHeaders })
    }

    // Update bank transfer status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', tx.id)

    return new Response(JSON.stringify({ success: true, message: 'Bank transfer marked as completed.' }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 