import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

function uint8ToBase64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8));
}

// TODO: Replace with your own DB logic
const getExpectedChallengeForUser = async (userId: string) => {
  // Retrieve the challenge you generated for this user during registration
  // For demo, return a static string (replace in production)
  return 'EXPECTED_CHALLENGE_FROM_DB';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, credential, expectedChallenge } = await req.json();
    if (!userId || !credential) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    // In production, fetch the expected challenge from your DB
    const challenge = expectedChallenge || (await getExpectedChallengeForUser(userId));

    // TODO: Fetch the expected origin and RP ID from your config
    const expectedOrigin = 'https://your-app-domain.com';
    const expectedRPID = new URL(req.url).hostname;

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
    });

    if (verification.verified && verification.registrationInfo) {
      const info = verification.registrationInfo;
      const insertObj: any = {
        user_id: userId,
        credential_id: uint8ToBase64(info.credentialID),
        public_key: uint8ToBase64(info.credentialPublicKey),
        counter: info.counter,
      };
      if ('transports' in info && info.transports) {
        insertObj.transports = info.transports;
      }
      const { error } = await supabase.from('webauthn_credentials').insert(insertObj);
      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true, info }), { status: 200, headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Verification failed' }), { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}); 