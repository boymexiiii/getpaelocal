import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  // TODO: Add real admin auth check here
  if (req.method === 'GET') {
    // Fetch system status from platform_settings
    const { data, error } = await supabase.from('platform_settings').select('*');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    const settings = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
    // Fetch real audit logs
    const { data: logsData, error: logsError } = await supabase
      .from('audit_logs')
      .select('id, action, table_name, record_id, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50);
    if (logsError) return new Response(JSON.stringify({ error: logsError.message }), { status: 500 });
    const logs = (logsData || []).map((log: any) => ({
      id: log.id,
      message: `[${log.action}] ${log.table_name || ''} ${log.record_id ? 'ID: ' + log.record_id : ''}`.trim(),
      timestamp: log.created_at,
    }));
    return new Response(JSON.stringify({
      status: {
        uptime: settings.uptime || '99.98%',
        lastBackup: settings.last_backup || '2024-07-01 02:00',
        cacheStatus: settings.cache_status || 'Healthy',
      },
      logs,
    }), { status: 200 });
  }
  if (req.method === 'POST') {
    const { action } = await req.json();
    // Placeholder: just return success
    // TODO: Integrate with backend for real actions
    if (action === 'clear_cache' || action === 'trigger_backup') {
      return new Response(JSON.stringify({ success: true, message: `${action} triggered (TODO: real integration)` }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  }
  return new Response('Method Not Allowed', { status: 405 });
}); 