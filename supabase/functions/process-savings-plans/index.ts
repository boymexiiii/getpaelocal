import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getNextRun(current: Date, frequency: string): Date {
  const next = new Date(current);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    // Fetch all active plans due to run
    const now = new Date();
    const { data: plans, error } = await supabase
      .from('savings_plans')
      .select('*')
      .eq('active', true)
      .lte('next_run', now.toISOString());
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    let processed = 0, failed = 0;
    for (const plan of plans) {
      // Fetch user's wallet (NGN)
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', plan.user_id)
        .eq('currency', 'NGN')
        .single();
      if (walletError || !wallet || wallet.balance < plan.amount) {
        failed++;
        continue;
      }
      // Deduct from wallet
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance - plan.amount })
        .eq('id', wallet.id);
      if (walletUpdateError) { failed++; continue; }
      // Find a goal for this user (for now, pick any active goal)
      const { data: goal, error: goalError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', plan.user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (goalError || !goal) { failed++; continue; }
      // Add to goal
      const { error: goalUpdateError } = await supabase
        .from('savings_goals')
        .update({ current_amount: goal.current_amount + plan.amount, updated_at: new Date().toISOString() })
        .eq('id', goal.id);
      if (goalUpdateError) { failed++; continue; }
      // Log transaction
      await supabase.from('savings_transactions').insert({
        user_id: plan.user_id,
        plan_id: plan.id,
        amount: plan.amount,
        status: 'completed',
        run_at: now.toISOString(),
        created_at: now.toISOString()
      });
      // Update next_run
      const nextRun = getNextRun(new Date(plan.next_run || now), plan.frequency);
      await supabase.from('savings_plans').update({ next_run: nextRun.toISOString(), updated_at: new Date().toISOString() }).eq('id', plan.id);
      processed++;
    }
    return new Response(JSON.stringify({ processed, failed }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 