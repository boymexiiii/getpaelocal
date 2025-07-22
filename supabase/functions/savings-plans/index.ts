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
      // Fetch all savings plans for user
      const { data, error } = await supabase.from('savings_plans').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ plans: data }), { status: 200, headers: corsHeaders });
    }
    if (req.method === 'POST') {
      // Create a new savings plan
      const { type, rule, amount, frequency, next_run, active } = await req.json();
      if (!type || !amount || !frequency) {
        return new Response(JSON.stringify({ error: 'Missing type, amount, or frequency' }), { status: 400, headers: corsHeaders });
      }
      const { data, error } = await supabase.from('savings_plans').insert({
        user_id,
        type,
        rule: rule || null,
        amount,
        frequency,
        next_run: next_run || null,
        active: active !== undefined ? active : true
      }).select('*').single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ plan: data }), { status: 201, headers: corsHeaders });
    }
    if (req.method === 'PATCH') {
      // Update a savings plan
      const { id, ...updates } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: 'Missing plan id' }), { status: 400, headers: corsHeaders });
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('savings_plans').update(updates).eq('id', id).eq('user_id', user_id).select('*').single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ plan: data }), { status: 200, headers: corsHeaders });
    }
    if (req.method === 'DELETE') {
      // Delete a savings plan
      const { id } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: 'Missing plan id' }), { status: 400, headers: corsHeaders });
      const { error } = await supabase.from('savings_plans').delete().eq('id', id).eq('user_id', user_id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 