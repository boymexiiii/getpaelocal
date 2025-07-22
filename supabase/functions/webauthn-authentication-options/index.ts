// If running in Supabase Edge Functions (Deno), use the following import:
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const getUserAuthenticators = async (userId: string): Promise<any[]> => {
  // Fetch user's registered authenticators from your DB
  const { data, error } = await supabase.from('webauthn_credentials').select('*').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: base64ToUint8Array(row.credential_id),
    type: 'public-key',
    transports: row.transports || undefined,
  }));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: corsHeaders });
    }

    const userAuthenticators: any[] = await getUserAuthenticators(userId);

    const options = generateAuthenticationOptions({
      allowCredentials: userAuthenticators,
      userVerification: 'preferred',
      timeout: 60000,
      rpID: new URL(req.url).hostname,
    });

    // TODO: Store the challenge in your DB for this user for later verification

    return new Response(JSON.stringify(options), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}); 