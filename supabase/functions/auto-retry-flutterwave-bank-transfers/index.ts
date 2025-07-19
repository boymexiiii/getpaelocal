import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY') ?? ''
    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()

    // Find bank transfers marked as completed or pending, older than 10 minutes
    const { data: transfers, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_type', 'bank_transfer')
      .in('status', ['completed', 'pending'])
      .lte('created_at', tenMinutesAgo)

    if (error) throw new Error('Failed to fetch transfers: ' + error.message)
    if (!transfers || transfers.length === 0) {
      return new Response(JSON.stringify({ message: 'No stale transfers found.' }), { headers: corsHeaders })
    }

    let results: any[] = []
    for (const tx of transfers) {
      // Revalidate with Flutterwave
      const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${tx.reference}/verify`, {
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      })
      const flwData = await flwRes.json()
      let newStatus = tx.status
      let note = ''
      if (!flwData.status || !flwData.data) {
        note = 'Failed to fetch status from Flutterwave.'
      } else if (flwData.data.status === 'successful') {
        newStatus = 'completed'
        note = 'Flutterwave confirms transfer as successful.'
      } else if (flwData.data.status === 'failed' || flwData.data.status === 'reversed') {
        newStatus = 'failed'
        note = 'Flutterwave reports transfer as failed or reversed.'
        // Optionally refund wallet if not already refunded
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
      } else {
        newStatus = flwData.data.status
        note = 'Flutterwave reports transfer as ' + flwData.data.status
      }
      // Update transaction if status changed
      if (newStatus !== tx.status) {
        await supabase
          .from('transactions')
          .update({ status: newStatus, admin_note: note })
          .eq('id', tx.id)
      }
      // Log an alert for admin
      await supabase.from('admin_alerts').insert({
        alert_type: 'bank_transfer_stuck',
        message: `Auto-retry: Transfer ${tx.id} status: ${newStatus}. ${note}`,
        target_type: 'transaction',
        target_id: tx.id,
        status: 'unread',
        created_at: new Date().toISOString()
      })
      results.push({ id: tx.id, oldStatus: tx.status, newStatus, note })
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}) 