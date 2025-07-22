import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
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

// TODO: Replace with your own DB logic
const getExpectedChallengeForUser = async (userId: string) => {
  // Retrieve the challenge you generated for this user during authentication
  // For demo, return a static string (replace in production)
  return 'EXPECTED_CHALLENGE_FROM_DB';
};

const getAuthenticatorForCredentialID = async (credentialID: string) => {
  // Fetch the authenticator info (publicKey, counter, etc.) for this credentialID from your DB
  const { data, error } = await supabase.from('webauthn_credentials').select('*').eq('credential_id', credentialID).single();
  if (error || !data) return null;
  return {
    credentialPublicKey: base64ToUint8Array(data.public_key),
    credentialID: base64ToUint8Array(data.credential_id),
    counter: data.counter,
    transports: data.transports || undefined,
  };
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

    // Fetch authenticator info from DB
    const authenticator = await getAuthenticatorForCredentialID(credential.id);
    if (!authenticator) {
      return new Response(JSON.stringify({ success: false, error: 'Authenticator not found' }), { status: 404, headers: corsHeaders });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
      authenticator,
    });

    if (verification.verified && verification.authenticationInfo) {
      // Update authenticator counter in DB
      await supabase.from('webauthn_credentials').update({ counter: verification.authenticationInfo.newCounter }).eq('credential_id', credential.id);
      return new Response(JSON.stringify({ success: true, info: verification.authenticationInfo }), { status: 200, headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Verification failed' }), { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}); 