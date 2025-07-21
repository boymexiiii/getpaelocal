import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  // TODO: Add authentication/authorization for admin
  try {
    if (req.method === 'POST') {
      const { action, user_id, email, admin_id, reason } = await req.json();
      if (!action || (!user_id && !email) || !admin_id) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      // Find user_id if only email provided
      let uid = user_id;
      if (!uid && email) {
        const { data: users, error: userErr } = await supabase.from('profiles').select('id').eq('email', email);
        if (userErr || !users.length) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        uid = users[0].id;
      }
      if (!uid) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      if (action === 'export') {
        // Export all user data
        const [profile, transactions, kyc, wallets] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', uid),
          supabase.from('transactions').select('*').eq('user_id', uid),
          supabase.from('kyc_applications').select('*').eq('user_id', uid),
          supabase.from('wallets').select('*').eq('user_id', uid),
        ]);
        return new Response(JSON.stringify({
          profile: profile.data,
          transactions: transactions.data,
          kyc_applications: kyc.data,
          wallets: wallets.data,
        }), { headers: { 'Content-Type': 'application/json' } });
      } else if (action === 'delete') {
        // Delete all user data (hard delete for demo, soft delete recommended in production)
        const tables = ['transactions', 'kyc_applications', 'wallets', 'profiles'];
        for (const table of tables) {
          await supabase.from(table).delete().eq(table === 'profiles' ? 'id' : 'user_id', uid);
        }
        await supabase.from('audit_logs').insert({
          action: 'DELETE_USER_DATA',
          user_id: admin_id,
          table_name: 'profiles',
          record_id: uid,
          old_data: null,
          new_data: null,
          created_at: new Date().toISOString(),
          ip_address: null,
          user_agent: null,
        });
        return new Response(JSON.stringify({ success: true }));
      } else {
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
      }
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 