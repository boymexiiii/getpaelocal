import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  // TODO: Add real admin auth check here
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { user_id } = await req.json();
  if (!user_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
  }
  // TODO: Use Supabase Admin API to generate a one-time login token for the user
  // Placeholder: return a fake token
  // In production, use: supabase.auth.admin.generateLink({ type: 'magiclink', userId: user_id })
  return new Response(JSON.stringify({ token: 'FAKE_TOKEN_FOR_' + user_id }), { status: 200 });
}); 