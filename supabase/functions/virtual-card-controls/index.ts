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
    const { card_id, user_id, action, spending_limit } = await req.json();
    if (!card_id || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing card_id or user_id' }), { status: 400, headers: corsHeaders });
    }
    if (req.method === 'PATCH') {
      if (action === 'lock' || action === 'unlock') {
        const status = action === 'lock' ? 'blocked' : 'active';
        const { data, error } = await supabase.from('virtual_cards').update({ status, updated_at: new Date().toISOString() }).eq('id', card_id).eq('user_id', user_id).select('*').single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        return new Response(JSON.stringify({ card: data }), { status: 200, headers: corsHeaders });
      }
      if (action === 'set_limit') {
        if (spending_limit === undefined) {
          return new Response(JSON.stringify({ error: 'Missing spending_limit' }), { status: 400, headers: corsHeaders });
        }
        const { data, error } = await supabase.from('virtual_cards').update({ spending_limit, updated_at: new Date().toISOString() }).eq('id', card_id).eq('user_id', user_id).select('*').single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        return new Response(JSON.stringify({ card: data }), { status: 200, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 