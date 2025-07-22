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
  try {
    const { user_id, type, enabled } = await req.json();
    if (!user_id || !type || typeof enabled !== 'boolean') {
      return new Response(JSON.stringify({ success: false, message: 'Missing fields' }), { status: 400, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    let updateObj = {};
    if (type === 'login') {
      updateObj = { login_notifications_enabled: enabled };
    } else if (type === 'transaction') {
      updateObj = { transaction_alerts_enabled: enabled };
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid type' }), { status: 400, headers: corsHeaders });
    }
    const { error } = await supabase.from('profiles').update(updateObj).eq('id', user_id);
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers: corsHeaders });
  }
}); 