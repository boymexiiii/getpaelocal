import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  // TODO: Add authentication/authorization for admin
  try {
    if (req.method === 'GET') {
      const type = searchParams.get('type'); // users or transactions
      const format = searchParams.get('format') || 'json';
      if (!type) return new Response(JSON.stringify({ error: 'Missing type' }), { status: 400 });
      let query = supabase.from(type).select('*');
      // Add filters if needed
      const { data, error } = await query;
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      if (format === 'csv') {
        const columns = Object.keys(data[0] || {});
        const csv = [columns.join(',')].concat(data.map(l => columns.map(c => JSON.stringify(l[c] ?? '')).join(','))).join('\n');
        return new Response(csv, { headers: { 'Content-Type': 'text/csv' } });
      }
      return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'POST') {
      const { type, data, admin_id } = await req.json();
      if (!type || !data || !admin_id) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      // Validate data (basic)
      if (!Array.isArray(data) || !data.length) return new Response(JSON.stringify({ error: 'No data to import' }), { status: 400 });
      // Insert/update
      const { data: inserted, error } = await supabase.from(type).upsert(data).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'BULK_IMPORT',
        user_id: admin_id,
        table_name: type,
        record_id: null,
        old_data: null,
        new_data: { count: inserted.length },
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true, count: inserted.length }));
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 