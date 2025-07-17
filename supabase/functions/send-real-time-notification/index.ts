import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userId: string
  type: 'transaction' | 'kyc_update' | 'security_alert' | 'payment_received' | 'wallet_funded'
  title: string
  message: string
  data?: any
  channels?: ('email' | 'sms' | 'push')[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      userId, 
      type, 
      title, 
      message, 
      data = {},
      channels = ['push'] 
    }: NotificationRequest = await req.json()

    console.log('Sending real-time notification:', { userId, type, title })

    // Get user profile for notification preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    const userName = profile ? 
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User' : 
      'User'

    // Send real-time notification via Supabase Realtime
    const channel = supabase.channel(`user_${userId}`)
    
    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString(),
        read: false
      }
    })

    // Send email notification if requested
    if (channels.includes('email')) {
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: type === 'transaction' ? 'transaction' : 
                  type === 'kyc_update' ? 'kyc_update' : 
                  'security_alert',
            to: data.userEmail || `user${userId}@example.com`, // You'd get this from auth
            data: {
              userName,
              ...data
            }
          }
        })
      } catch (emailError) {
        console.error('Email notification failed:', emailError)
      }
    }

    // Send SMS notification if requested and phone available
    if (channels.includes('sms') && profile?.phone) {
      try {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: profile.phone,
            message: `${title}\n${message}`,
            type: 'notification'
          }
        })
      } catch (smsError) {
        console.error('SMS notification failed:', smsError)
      }
    }

    // Store notification in database for history
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        channels,
        status: 'sent'
      })

    if (insertError) {
      console.error('Error storing notification:', insertError)
    }

    console.log('Real-time notification sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notification sent successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error: any) {
    console.error('Real-time notification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send notification'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})