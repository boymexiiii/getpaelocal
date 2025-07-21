import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function checkSupabase() {
  try {
    const { error } = await supabase.from('roles').select('*').limit(1);
    if (error) throw error;
    return { name: 'Supabase', status: 'healthy', lastChecked: new Date().toISOString() };
  } catch (e: any) {
    return { name: 'Supabase', status: 'error', lastChecked: new Date().toISOString(), error: e.message };
  }
}

async function checkIntegration(name: string, url: string) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return { name, status: 'healthy', lastChecked: new Date().toISOString() };
  } catch (e: any) {
    return { name, status: 'error', lastChecked: new Date().toISOString(), error: e.message };
  }
}

serve(async (_req) => {
  // TODO: Add authentication for admin
  const results = await Promise.all([
    checkSupabase(),
    checkIntegration('Flutterwave', 'https://api.flutterwave.com/v3/health'), // Replace with real health endpoint if available
    checkIntegration('Paystack', 'https://api.paystack.co/health'), // Replace with real health endpoint if available
    checkIntegration('Monnify', 'https://sandbox.monnify.com/api/v1/health'), // Replace with real health endpoint if available
  ]);
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
}); 