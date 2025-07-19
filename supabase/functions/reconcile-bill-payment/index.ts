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
    const VTUPASS_API_KEY = Deno.env.get('VTUPASS_API_KEY') ?? ''
    const { transactionId, reference } = await req.json()
    if (!transactionId && !reference) {
      return new Response(JSON.stringify({ error: 'transactionId or reference required' }), { status: 400, headers: corsHeaders })
    }

    // Find the bill payment transaction
    let { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq(transactionId ? 'id' : 'reference', transactionId || reference)
      .eq('transaction_type', 'bill_payment')
      .single()

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: 'Bill payment transaction not found' }), { status: 404, headers: corsHeaders })
    }

    // Query VTUPass API for the latest status
    const vtupassRes = await fetch(`https://vtupass.com/api/requery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': VTUPASS_API_KEY,
      },
      body: JSON.stringify({ request_id: tx.reference })
    })
    const vtupassData = await vtupassRes.json()
    if (!vtupassData.status) {
      return new Response(JSON.stringify({ error: 'Failed to fetch status from VTUPass', vtupassData }), { status: 500, headers: corsHeaders })
    }

    // Determine new status
    let newStatus = tx.status
    let note = ''
    if (vtupassData.status === 'success') {
      newStatus = 'completed'
      note = 'VTUPass reports bill payment as successful.'
    } else if (vtupassData.status === 'failed' || vtupassData.status === 'reversed') {
      newStatus = 'failed'
      note = 'VTUPass reports bill payment as failed or reversed.'
    } else {
      newStatus = vtupassData.status
      note = 'VTUPass reports bill payment as ' + vtupassData.status
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
      action: 'reconcile_bill_payment',
      target_type: 'transaction',
      target_id: tx.id,
      details: { old_status: tx.status, new_status: newStatus, note, vtupass_response: vtupassData },
      created_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true, newStatus, note, vtupassData }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 