import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  // TODO: Add authentication/authorization for admin
  try {
    if (req.method === 'GET') {
      const status = searchParams.get('status');
      const assigned_to = searchParams.get('assigned_to');
      const created_by = searchParams.get('created_by');
      const due = searchParams.get('due_date');
      let query = supabase.from('admin_tasks').select('*');
      if (status) query = query.eq('status', status);
      if (assigned_to) query = query.eq('assigned_to', assigned_to);
      if (created_by) query = query.eq('created_by', created_by);
      if (due) query = query.lte('due_date', due);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { title, description, assigned_to, priority, due_date, created_by } = body;
      if (!title || !description || !assigned_to || !priority || !created_by) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data, error } = await supabase.from('admin_tasks').insert({ title, description, assigned_to, priority, due_date, created_by }).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'CREATE_ADMIN_TASK',
        user_id: created_by,
        table_name: 'admin_tasks',
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
      const { id, status, completed_at, updated_by } = body;
      if (!id || !status || !updated_by) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data: oldData } = await supabase.from('admin_tasks').select('*').eq('id', id).single();
      const updateFields: any = { status };
      if (completed_at) updateFields.completed_at = completed_at;
      const { data, error } = await supabase.from('admin_tasks').update(updateFields).eq('id', id).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_ADMIN_TASK',
        user_id: updated_by,
        table_name: 'admin_tasks',
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