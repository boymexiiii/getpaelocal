import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  try {
    const url = new URL(req.url);
    const user_id = url.searchParams.get('user_id');
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: corsHeaders });
    }
    if (req.method === 'GET') {
      // Fetch all savings goals for user
      const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ goals: data }), { status: 200, headers: corsHeaders });
    }
    if (req.method === 'POST') {
      // Create a new savings goal
      const { name, target_amount, deadline } = await req.json();
      if (!name || !target_amount) {
        return new Response(JSON.stringify({ error: 'Missing name or target_amount' }), { status: 400, headers: corsHeaders });
      }
      const { data, error } = await supabase.from('savings_goals').insert({
        user_id,
        name,
        target_amount,
        deadline: deadline || null
      }).select('*').single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ goal: data }), { status: 201, headers: corsHeaders });
    }
    if (req.method === 'POST' && url.pathname.endsWith('/add-funds')) {
      // Add funds to a savings goal
      const { goal_id, amount } = await req.json();
      if (!goal_id || !amount) {
        return new Response(JSON.stringify({ error: 'Missing goal_id or amount' }), { status: 400, headers: corsHeaders });
      }
      // Update goal
      const { data: goal, error: goalError } = await supabase.from('savings_goals').select('*').eq('id', goal_id).eq('user_id', user_id).single();
      if (goalError || !goal) return new Response(JSON.stringify({ error: 'Goal not found' }), { status: 404, headers: corsHeaders });
      const newAmount = Number(goal.current_amount) + Number(amount);
      const { error: updateError } = await supabase.from('savings_goals').update({ current_amount: newAmount, updated_at: new Date().toISOString() }).eq('id', goal_id);
      if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: corsHeaders });
      // Log transaction
      await supabase.from('savings_transactions').insert({
        user_id,
        plan_id: null,
        amount,
        status: 'completed',
        run_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }
    if (req.method === 'POST' && url.pathname.endsWith('/withdraw-funds')) {
      // Withdraw funds from a savings goal
      const { goal_id, amount } = await req.json();
      if (!goal_id || !amount) {
        return new Response(JSON.stringify({ error: 'Missing goal_id or amount' }), { status: 400, headers: corsHeaders });
      }
      // Update goal
      const { data: goal, error: goalError } = await supabase.from('savings_goals').select('*').eq('id', goal_id).eq('user_id', user_id).single();
      if (goalError || !goal) return new Response(JSON.stringify({ error: 'Goal not found' }), { status: 404, headers: corsHeaders });
      if (Number(goal.current_amount) < Number(amount)) {
        return new Response(JSON.stringify({ error: 'Insufficient funds in goal' }), { status: 400, headers: corsHeaders });
      }
      const newAmount = Number(goal.current_amount) - Number(amount);
      const { error: updateError } = await supabase.from('savings_goals').update({ current_amount: newAmount, updated_at: new Date().toISOString() }).eq('id', goal_id);
      if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: corsHeaders });
      // Log transaction
      await supabase.from('savings_transactions').insert({
        user_id,
        plan_id: null,
        amount: -Math.abs(amount),
        status: 'completed',
        run_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }
    if (req.method === 'PATCH') {
      // Update a savings goal
      const { id, ...updates } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: 'Missing goal id' }), { status: 400, headers: corsHeaders });
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('savings_goals').update(updates).eq('id', id).eq('user_id', user_id).select('*').single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ goal: data }), { status: 200, headers: corsHeaders });
    }
    if (req.method === 'DELETE') {
      // Delete a savings goal
      const { id } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: 'Missing goal id' }), { status: 400, headers: corsHeaders });
      const { error } = await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', user_id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 