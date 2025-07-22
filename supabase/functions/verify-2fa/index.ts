import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { totp } from 'https://esm.sh/otplib@12.0.1';
import { decrypt } from '../_utils/encryption.ts';
import * as Sentry from "https://deno.land/x/sentry@0.7.0/mod.ts";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  tracesSampleRate: 1.0,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { user_id, code } = await req.json();
    if (!user_id || !code) {
      return new Response(JSON.stringify({ success: false, message: 'Missing fields' }), { status: 400, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    // Fetch the user's 2FA secret
    const { data: profile, error } = await supabase.from('profiles').select('twofa_secret').eq('id', user_id).single();
    if (error || !profile?.twofa_secret) {
      return new Response(JSON.stringify({ success: false, message: '2FA secret not found' }), { status: 404, headers: corsHeaders });
    }
    // Decrypt the secret before verifying
    const decryptedSecret = await decrypt(profile.twofa_secret);
    // Verify the code
    const isValid = totp.check(code, decryptedSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid code' }), { status: 401, headers: corsHeaders });
    }
    // Mark 2FA as enabled
    const { error: updateError } = await supabase.from('profiles').update({ twofa_enabled: true }).eq('id', user_id);
    if (updateError) {
      return new Response(JSON.stringify({ success: false, message: updateError.message }), { status: 500, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (e) {
    Sentry.captureException(e);
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers: corsHeaders });
  }
}); 