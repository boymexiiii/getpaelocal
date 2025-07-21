import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  // TODO: Add authentication/authorization for admin
  try {
    if (req.method === 'GET' && pathname.endsWith('/verify')) {
      // Verify hash chain
      const { data: logs, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: true });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      let prevHash = '';
      for (const log of logs) {
        const logData = { ...log };
        delete logData.hash;
        delete logData.prev_hash;
        const expectedHash = await sha256(prevHash + JSON.stringify(logData));
        if (log.hash !== expectedHash) {
          return new Response(JSON.stringify({ valid: false, invalidId: log.id }), { headers: { 'Content-Type': 'application/json' } });
        }
        prevHash = log.hash;
      }
      return new Response(JSON.stringify({ valid: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'GET') {
      // Export logs (JSON or CSV)
      const format = searchParams.get('format') || 'json';
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const user = searchParams.get('user');
      const action = searchParams.get('action');
      let query = supabase.from('audit_logs').select('*');
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);
      if (user) query = query.eq('user_id', user);
      if (action) query = query.eq('action', action);
      const { data: logs, error } = await query.order('created_at', { ascending: true });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      if (format === 'csv') {
        const columns = Object.keys(logs[0] || {});
        const csv = [columns.join(',')].concat(logs.map(l => columns.map(c => JSON.stringify(l[c] ?? '')).join(','))).join('\n');
        return new Response(csv, { headers: { 'Content-Type': 'text/csv' } });
      }
      return new Response(JSON.stringify({ data: logs }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 