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
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY') ?? ''
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

    // Query Flutterwave API for the latest status
    const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${tx.reference}/verify`, {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    const flwData = await flwRes.json()
    if (!flwData.status || !flwData.data) {
      return new Response(JSON.stringify({ error: 'Failed to fetch status from Flutterwave', flwData }), { status: 500, headers: corsHeaders })
    }

    // Determine new status
    let newStatus = tx.status
    let note = ''
    if (flwData.data.status === 'successful') {
      newStatus = 'completed'
      note = 'Flutterwave reports transfer as successful.'
    } else if (flwData.data.status === 'failed' || flwData.data.status === 'reversed') {
      newStatus = 'failed'
      note = 'Flutterwave reports transfer as failed or reversed.'
    } else {
      newStatus = flwData.data.status
      note = 'Flutterwave reports transfer as ' + flwData.data.status
    }

    // Update transaction status if changed
    if (newStatus !== tx.status) {
      await supabase
        .from('transactions')
        .update({ status: newStatus, admin_note: note })
        .eq('id', tx.id)
    }

    // Optionally, log the reconciliation
    await supabase.from('admin_actions').insert({
      admin_id: 'system',
      action: 'reconcile_bank_transfer',
      target_type: 'transaction',
      target_id: tx.id,
      details: { old_status: tx.status, new_status: newStatus, note, flw_response: flwData },
      created_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true, newStatus, note, flwData }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 