import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  // TODO: Add authentication/authorization for admin
  try {
    if (req.method === 'GET') {
      const status = searchParams.get('status');
      const severity = searchParams.get('severity');
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      let query = supabase.from('incidents').select('*');
      if (status) query = query.eq('status', status);
      if (severity) query = query.eq('severity', severity);
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { title, description, severity, affected_services, created_by } = body;
      if (!title || !description || !severity || !created_by) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data, error } = await supabase.from('incidents').insert({ title, description, severity, affected_services, created_by }).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'CREATE_INCIDENT',
        user_id: created_by,
        table_name: 'incidents',
        record_id: data[0].id,
        old_data: null,
        new_data: data[0],
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true, data: data[0] }));
    }
    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, status, resolution_notes, resolved_at, updated_by } = body;
      if (!id || !status || !updated_by) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data: oldData } = await supabase.from('incidents').select('*').eq('id', id).single();
      const updateFields: any = { status };
      if (resolution_notes) updateFields.resolution_notes = resolution_notes;
      if (resolved_at) updateFields.resolved_at = resolved_at;
      const { data, error } = await supabase.from('incidents').update(updateFields).eq('id', id).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_INCIDENT',
        user_id: updated_by,
        table_name: 'incidents',
        record_id: id,
        old_data: oldData,
        new_data: data[0],
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true, data: data[0] }));
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 