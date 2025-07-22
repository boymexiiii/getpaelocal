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
    if (req.method === 'POST') {
      // Log a login event
      const { user_id, device, browser, ip_address, location } = await req.json();
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: corsHeaders });
      }
      const { error } = await supabase.from('login_history').insert({
        user_id,
        device: device || null,
        browser: browser || null,
        ip_address: ip_address || null,
        location: location || null,
        logged_in_at: new Date().toISOString()
      });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ success: true }), { status: 201, headers: corsHeaders });
    }
    if (req.method === 'GET') {
      // Fetch recent login history for a user
      const url = new URL(req.url);
      const user_id = url.searchParams.get('user_id');
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: corsHeaders });
      }
      const { data, error } = await supabase.from('login_history').select('*').eq('user_id', user_id).order('logged_in_at', { ascending: false }).limit(10);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ history: data }), { status: 200, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 