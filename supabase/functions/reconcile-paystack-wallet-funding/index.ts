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
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
    const { transactionId, reference } = await req.json()
    if (!transactionId && !reference) {
      return new Response(JSON.stringify({ error: 'transactionId or reference required' }), { status: 400, headers: corsHeaders })
    }

    // Find the wallet funding transaction
    let { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq(transactionId ? 'id' : 'reference', transactionId || reference)
      .eq('transaction_type', 'deposit')
      .single()

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: 'Wallet funding transaction not found' }), { status: 404, headers: corsHeaders })
    }

    // Query Paystack API for the latest status
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${tx.reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    const paystackData = await paystackRes.json()
    if (!paystackData.status || !paystackData.data) {
      return new Response(JSON.stringify({ error: 'Failed to fetch status from Paystack', paystackData }), { status: 500, headers: corsHeaders })
    }

    // Determine new status
    let newStatus = tx.status
    let note = ''
    if (paystackData.data.status === 'success') {
      newStatus = 'completed'
      note = 'Paystack reports funding as successful.'
    } else if (paystackData.data.status === 'failed' || paystackData.data.status === 'reversed') {
      newStatus = 'failed'
      note = 'Paystack reports funding as failed or reversed.'
    } else {
      newStatus = paystackData.data.status
      note = 'Paystack reports funding as ' + paystackData.data.status
    }

    // Update transaction status if changed
    if (newStatus !== tx.status) {
      await supabase
        .from('transactions')
        .update({ status: newStatus, admin_note: note })
        .eq('id', tx.id)
      // Credit wallet if completed and not already credited
      if (newStatus === 'completed') {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', tx.user_id)
          .eq('currency', 'NGN')
          .single()
        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance + tx.amount })
            .eq('id', wallet.id)
        }
      }
    }

    // Optionally, log the reconciliation
    await supabase.from('admin_actions').insert({
      admin_id: 'system',
      action: 'reconcile_wallet_funding',
      target_type: 'transaction',
      target_id: tx.id,
      details: { old_status: tx.status, new_status: newStatus, note, paystack_response: paystackData },
      created_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ success: true, newStatus, note, paystackData }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 