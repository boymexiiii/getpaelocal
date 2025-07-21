import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  // TODO: Add authentication/authorization for admin
  try {
    const body = await req.json();
    const { type, user_id, wallet_id, new_balance, transaction_id, reason, admin_id } = body;
    if (!type || !reason || !admin_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    if (type === 'balance') {
      // Fetch old wallet
      const { data: oldWallet, error: walletErr } = await supabase.from('wallets').select('*').eq('id', wallet_id).single();
      if (walletErr || !oldWallet) {
        return new Response(JSON.stringify({ error: 'Wallet not found' }), { status: 404 });
      }
      // Update balance
      const { error: updateErr } = await supabase.from('wallets').update({ balance: new_balance }).eq('id', wallet_id);
      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
      }
      // Log to audit_logs
      await supabase.from('audit_logs').insert({
        action: 'MANUAL_BALANCE_CORRECTION',
        user_id: admin_id,
        table_name: 'wallets',
        record_id: wallet_id,
        old_data: { balance: oldWallet.balance },
        new_data: { balance: new_balance },
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true }));
    } else if (type === 'rollback') {
      // Fetch old transaction
      const { data: oldTx, error: txErr } = await supabase.from('transactions').select('*').eq('id', transaction_id).single();
      if (txErr || !oldTx) {
        return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 });
      }
      // Mark as rolled back
      const { error: updateErr } = await supabase.from('transactions').update({ status: 'rolled_back' }).eq('id', transaction_id);
      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
      }
      // Log to audit_logs
      await supabase.from('audit_logs').insert({
        action: 'MANUAL_TRANSACTION_ROLLBACK',
        user_id: admin_id,
        table_name: 'transactions',
        record_id: transaction_id,
        old_data: { status: oldTx.status },
        new_data: { status: 'rolled_back' },
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true }));
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 