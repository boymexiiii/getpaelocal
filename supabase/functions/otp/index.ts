import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()

  if (req.method === 'POST' && path === 'generate') {
    // Generate, store, and send OTP
    try {
      const { user_id, type, purpose, expiry_minutes, userEmail, userPhone } = await req.json()
      if (!user_id || !type || !purpose) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
      }
      const otpCode = generateOTP()
      const expires_at = new Date(Date.now() + 1000 * 60 * (expiry_minutes || 10)).toISOString()
      // Store OTP
      const { error: insertError } = await supabase.from('otps').insert({
        user_id,
        code: otpCode,
        type,
        purpose,
        expires_at,
        used: false
      })
      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders })
      }
      // Send OTP (call existing notification/email/SMS function)
      if (type === 'email' && userEmail) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'otp',
            to: userEmail,
            data: {
              userName: userEmail,
              otpCode,
              expiryMinutes: expiry_minutes || 10,
              purpose
            }
          }
        })
      } else if (type === 'sms' && userPhone) {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: userPhone,
            message: `Your Pae verification code is: ${otpCode}. Valid for ${expiry_minutes || 10} minutes. Do not share this code.`,
            type: 'otp'
          }
        })
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
  }

  if (req.method === 'POST' && path === 'verify') {
    // Verify OTP
    try {
      const { user_id, code, purpose } = await req.json()
      if (!user_id || !code || !purpose) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
      }
      const { data: otps, error } = await supabase.from('otps')
        .select('*')
        .eq('user_id', user_id)
        .eq('code', code)
        .eq('purpose', purpose)
        .eq('used', false)
        .lte('expires_at', new Date().toISOString())
        .limit(1)
      if (error || !otps || otps.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid or expired OTP' }), { status: 400, headers: corsHeaders })
      }
      // Mark OTP as used
      await supabase.from('otps').update({ used: true, used_at: new Date().toISOString() }).eq('id', otps[0].id)
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders })
}) 