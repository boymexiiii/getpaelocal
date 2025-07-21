import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  // TODO: Add authentication/authorization for admin
  try {
    if (req.method === 'GET') {
      const reveal = searchParams.get('reveal') === 'true';
      const { data, error } = await supabase.from('integration_secrets').select('*');
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      const secrets = data.map(s => ({
        ...s,
        value: reveal ? s.value : '****',
      }));
      return new Response(JSON.stringify({ data: secrets }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { name, value, created_by } = body;
      if (!name || !value || !created_by) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data, error } = await supabase.from('integration_secrets').insert({ name, value, created_by }).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'ADD_INTEGRATION_SECRET',
        user_id: created_by,
        table_name: 'integration_secrets',
        record_id: data[0].id,
        old_data: null,
        new_data: { name, value: '****' },
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true, data: data[0] }));
    }
    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, value, updated_by } = body;
      if (!id || !value || !updated_by) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data: oldData } = await supabase.from('integration_secrets').select('*').eq('id', id).single();
      const { data, error } = await supabase.from('integration_secrets').update({ value, updated_at: new Date().toISOString() }).eq('id', id).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_INTEGRATION_SECRET',
        user_id: updated_by,
        table_name: 'integration_secrets',
        record_id: id,
        old_data: { value: '****' },
        new_data: { value: '****' },
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true, data: data[0] }));
    }
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { id, deleted_by } = body;
      if (!id || !deleted_by) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data: oldData } = await supabase.from('integration_secrets').select('*').eq('id', id).single();
      const { error } = await supabase.from('integration_secrets').delete().eq('id', id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'DELETE_INTEGRATION_SECRET',
        user_id: deleted_by,
        table_name: 'integration_secrets',
        record_id: id,
        old_data: { name: oldData?.name, value: '****' },
        new_data: null,
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true }));
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 