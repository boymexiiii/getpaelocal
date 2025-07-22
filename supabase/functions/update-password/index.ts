import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, currentPassword, newPassword } = await req.json();
    if (!user_id || !currentPassword || !newPassword) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch user from auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), { status: 404, headers: corsHeaders });
    }

    // Validate current password (Supabase does not allow password check directly)
    // So, try to sign in with the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.user.email,
      password: currentPassword
    });
    if (signInError) {
      return new Response(JSON.stringify({ success: false, message: 'Current password is incorrect' }), { status: 401, headers: corsHeaders });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user_id, { password: newPassword });
    if (updateError) {
      return new Response(JSON.stringify({ success: false, message: updateError.message }), { status: 500, headers: corsHeaders });
    }

    // Fetch user profile for email and name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', user_id)
      .single();

    if (!profileError && profile && profile.email) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'security_alert',
            to: profile.email,
            data: {
              userName: profile.first_name || 'User',
              alertType: 'Password Changed',
              message: 'Your account password was changed. If this was not you, please contact support immediately.',
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (emailError) {
        console.error('Failed to send security alert email:', emailError);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers: corsHeaders });
  }
}); 