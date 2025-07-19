import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY') ?? ''

  try {
    // Fetch all processing Flutterwave bank transfers
    const { data: txs, error: txsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'processing')
      .eq('transaction_type', 'bank_transfer')
      .not('flw_reference', 'is', null)

    if (txsError) throw new Error('Failed to fetch transactions: ' + txsError.message)
    if (!txs || txs.length === 0) {
      return new Response(JSON.stringify({ message: 'No processing transfers found.' }), { headers: corsHeaders })
    }

    const results = []
    for (const tx of txs) {
      // Query Flutterwave API for latest status
      const flwRes = await fetch(`https://api.flutterwave.com/v3/transfers/${tx.flw_reference}`, {
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      })
      const flwData = await flwRes.json()
      let newStatus = tx.status
      let note = ''
      if (flwData.status === 'success' && flwData.data) {
        if (flwData.data.status === 'SUCCESSFUL') {
          newStatus = 'completed'
          note = 'Flutterwave reports transfer as successful.'
        } else if (flwData.data.status === 'FAILED') {
          newStatus = 'failed'
          note = 'Flutterwave reports transfer as failed.'
        } else if (flwData.data.status === 'REVERSED') {
          newStatus = 'reversed'
          note = 'Flutterwave reports transfer as reversed.'
        } else {
          newStatus = flwData.data.status.toLowerCase()
          note = 'Flutterwave reports transfer as ' + flwData.data.status
        }
      } else {
        note = 'Failed to fetch status from Flutterwave.'
      }

      // Update transaction status and flw_response
      await supabase
        .from('transactions')
        .update({ status: newStatus, flw_response: flwData.data })
        .eq('id', tx.id)

      // If failed or reversed, refund the user
      if ((newStatus === 'failed' || newStatus === 'reversed') && tx.amount > 0) {
        // Credit wallet
        await supabase
          .from('wallets')
          .update({ balance: tx.amount + tx.wallet_balance })
          .eq('user_id', tx.user_id)
          .eq('currency', 'NGN')
        // Insert refund transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: tx.user_id,
            transaction_type: 'refund',
            amount: tx.amount,
            status: 'completed',
            description: 'Refund for failed/reversed bank transfer',
            reference: `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            flw_reference: tx.flw_reference
          })
        // Fetch user email
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', tx.user_id)
          .single();
        if (userProfile && userProfile.email) {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              to: userProfile.email,
              subject: 'Bank Transfer Refunded',
              message: `Your transfer of ₦${tx.amount} was refunded due to failure or reversal.`
            }
          });
        }
        // Admin notification for high-value
        if (tx.amount > 100000) {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              to: 'admin@yourdomain.com',
              subject: 'High-value transfer failed',
              message: `Transfer ${tx.id} for ₦${tx.amount} failed or was reversed.`
            }
          });
        }
      }
      // Log action
      await supabase.from('webhook_logs').insert({
        provider: 'flutterwave',
        event: 'reconcile',
        payload: JSON.stringify({ tx_id: tx.id, flwData }),
        status: newStatus,
        created_at: new Date().toISOString(),
        note
      })
      results.push({ tx_id: tx.id, newStatus, note })
    }
    return new Response(JSON.stringify({ message: 'Reconciliation complete', results }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 