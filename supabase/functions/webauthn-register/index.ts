// If running in Supabase Edge Functions (Deno), use the following import:
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// If running in Node.js, use: import { createServer } from 'http';

import { generateRegistrationOptions } from '@simplewebauthn/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, username, displayName } = await req.json();
    if (!userId || !username || !displayName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    // TODO: Fetch user's existing credentials from your DB to prevent duplicate registration
    const userAuthenticators: any[] = [];

    const options = generateRegistrationOptions({
      rpName: 'PaePros',
      rpID: new URL(req.url).hostname,
      userID: userId,
      userName: username,
      userDisplayName: displayName,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      excludeCredentials: userAuthenticators.map(authr => ({
        id: authr.credentialID,
        type: 'public-key',
        transports: authr.transports,
      })),
    });

    return new Response(JSON.stringify(options), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}); 