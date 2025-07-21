// Supabase Edge Function for RBAC management
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { pathname } = new URL(req.url);
  if (req.method === 'GET' && pathname.endsWith('/roles')) {
    const { data, error } = await supabase.from('roles').select('*');
    return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (req.method === 'GET' && pathname.endsWith('/permissions')) {
    const { data, error } = await supabase.from('permissions').select('*');
    return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (req.method === 'GET' && pathname.endsWith('/role-permissions')) {
    const { data, error } = await supabase.from('role_permissions').select('*');
    return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (req.method === 'POST' && pathname.endsWith('/roles')) {
    const body = await req.json();
    // TODO: Auth check
    const { data, error } = await supabase.from('roles').insert({ name: body.name, description: body.description || null }).select();
    return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (req.method === 'POST' && pathname.endsWith('/permissions')) {
    const body = await req.json();
    // TODO: Auth check
    const { data, error } = await supabase.from('permissions').insert({ name: body.name, description: body.description || null }).select();
    return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (req.method === 'POST' && pathname.endsWith('/role-permissions')) {
    const body = await req.json();
    // TODO: Auth check
    if (body.action === 'add') {
      const { data, error } = await supabase.from('role_permissions').insert({ role_id: body.role_id, permission_id: body.permission_id }).select();
      return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
    } else if (body.action === 'remove') {
      const { data, error } = await supabase.from('role_permissions').delete().eq('role_id', body.role_id).eq('permission_id', body.permission_id).select();
      return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
    }
  }
  if (req.method === 'POST' && pathname.endsWith('/user-roles')) {
    const body = await req.json();
    // TODO: Auth check
    const { data, error } = await supabase.from('user_roles').update({ role_id: body.role_id }).eq('user_id', body.user_id).select();
    return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}); 