import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as Sentry from "https://deno.land/x/sentry@0.7.0/mod.ts";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  tracesSampleRate: 1.0,
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  // --- JWT Authentication and Role Validation ---
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let authedUser = null;
  let authedRole = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = authHeader.replace('Bearer ', '');
    // Validate JWT with Supabase
    const { data: userData, error: jwtError } = await supabase.auth.getUser(jwt);
    if (!jwtError && userData?.user) {
      authedUser = userData.user;
      authedRole = userData.user.user_metadata?.role || userData.user.role || null;
    }
  }
  if (!authedUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  // --- End JWT Authentication ---
  try {
    if (req.method === 'GET') {
      const user_id = searchParams.get('user_id');
      const email = searchParams.get('email');
      let sessions = [];
      // Only allow users to fetch their own sessions, or admins to fetch any
      if (user_id && user_id !== authedUser.id && authedRole !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      if (user_id) {
        const { data, error } = await supabase.from('user_sessions').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        sessions = data;
      } else if (email) {
        // Only admins can fetch by email
        if (authedRole !== 'admin') {
          return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }
        const { data: users, error: userErr } = await supabase.from('profiles').select('id').eq('email', email);
        if (userErr || !users.length) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        const { data, error } = await supabase.from('user_sessions').select('*').eq('user_id', users[0].id).order('created_at', { ascending: false });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        sessions = data;
      } else {
        return new Response(JSON.stringify({ error: 'Missing user_id or email' }), { status: 400 });
      }
      return new Response(JSON.stringify({ data: sessions }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'POST') {
      // Only admins can revoke sessions
      if (authedRole !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      const body = await req.json();
      const { session_id, admin_id } = body;
      if (!session_id || !admin_id) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      const { data: oldSession } = await supabase.from('user_sessions').select('*').eq('session_id', session_id).single();
      const { error } = await supabase.from('user_sessions').update({ revoked: true, revoked_at: new Date().toISOString() }).eq('session_id', session_id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      await supabase.from('audit_logs').insert({
        action: 'REVOKE_USER_SESSION',
        user_id: admin_id,
        table_name: 'user_sessions',
        record_id: oldSession?.id,
        old_data: oldSession,
        new_data: { ...oldSession, revoked: true },
        created_at: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
      });
      return new Response(JSON.stringify({ success: true }));
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (e: any) {
    Sentry.captureException(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 