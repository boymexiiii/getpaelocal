import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  // TODO: Add real admin auth check here
  if (req.method === 'GET') {
    // Fetch all support tickets
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
  }
  if (req.method === 'POST') {
    const { id } = await req.json();
    if (!id) return new Response(JSON.stringify({ error: 'Missing ticket id' }), { status: 400 });
    const { error } = await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  return new Response('Method Not Allowed', { status: 405 });
}); 