import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  to: string; // Phone number in international format
  message: string;
  type?: 'otp' | 'alert' | 'notification';
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, type = 'notification' }: SMSRequest = await req.json()

    // Validate phone number format
    if (!to || !to.startsWith('+')) {
      throw new Error('Phone number must be in international format (+234...)');
    }

    // Get API credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured')
    }

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', twilioPhoneNumber)
    formData.append('To', to)
    formData.append('Body', message)

    // Add auth header
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    const twilioResponse = await response.json()

    if (!response.ok) {
      throw new Error(twilioResponse.message || 'Failed to send SMS')
    }

    console.log('SMS sent successfully:', twilioResponse.sid)

    const result: SMSResponse = {
      success: true,
      messageId: twilioResponse.sid
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error: any) {
    console.error('SMS sending error:', error)
    
    const result: SMSResponse = {
      success: false,
      error: error.message || 'Failed to send SMS'
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})