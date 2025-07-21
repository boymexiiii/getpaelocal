import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  // TODO: Add real admin auth check here
  if (req.method === 'GET') {
    // Fetch all settings
    const { data, error } = await supabase.from('platform_settings').select('*');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    // Return as key-value map
    const settings = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
    return new Response(JSON.stringify(settings), { status: 200 });
  }
  if (req.method === 'POST') {
    const updates = await req.json();
    // For each key, upsert into platform_settings
    for (const [key, value] of Object.entries(updates)) {
      await supabase.from('platform_settings').upsert({ key, value });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  return new Response('Method Not Allowed', { status: 405 });
}); 