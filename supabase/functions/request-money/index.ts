import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fromEmail, amount, description, userId, requesterEmail, requesterName } = await req.json()

    console.log('Request money:', { fromEmail, amount, description, userId, requesterEmail, requesterName })

    // Find the person being requested from by email
    const { data: fromUserData, error: fromUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', fromEmail)
      .single()

    if (fromUserError || !fromUserData) {
      console.error('From user query error:', fromUserError)
      return new Response(
        JSON.stringify({ error: 'Person you are requesting from not found on the platform' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create transaction record for the request
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId, // requester
        recipient_id: fromUserData.id, // person being requested from
        transaction_type: 'request',
        amount,
        description,
        status: 'pending',
        reference: `REQ-${Date.now()}`
      })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create money request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Send notification email to the person being requested from
    try {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          to: fromEmail,
          subject: `Money Request from ${requesterName}`,
          type: 'money_request',
          data: {
            requesterName,
            requesterEmail,
            amount,
            description,
            currency: '₦'
          }
        }
      })
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Request money error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})