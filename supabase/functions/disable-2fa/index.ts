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
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ success: false, message: 'Missing user_id' }), { status: 400, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    // Disable 2FA and clear secret
    const { error } = await supabase.from('profiles').update({ twofa_enabled: false, twofa_secret: null }).eq('id', user_id);
    if (error) {
      // Sentry.captureException(error);
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: corsHeaders });
    }

    // Fetch user profile for email and name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', user_id)
      .single();

    if (!profileError && profile && profile.email) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'security_alert',
            to: profile.email,
            data: {
              userName: profile.first_name || 'User',
              alertType: '2FA Disabled',
              message: 'Two-factor authentication (2FA) was disabled on your account. If this was not you, please contact support immediately.',
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (emailError) {
        console.error('Failed to send security alert email:', emailError);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (e) {
    // Sentry.captureException(e);
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers: corsHeaders });
  }
}); 