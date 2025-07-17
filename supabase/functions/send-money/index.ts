
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { recipientEmail, amount, description, userId } = await req.json()

    console.log('Send money request:', { recipientEmail, amount, description, userId })

    // Find recipient by email in auth.users table
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Auth query error:', authError)
      return new Response(
        JSON.stringify({ error: 'Error finding recipient' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const recipient = authData.users.find(user => user.email === recipientEmail)
    if (!recipient) {
      return new Response(
        JSON.stringify({ error: 'Recipient not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }


    // Get sender's wallet
    const { data: senderWallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !senderWallet) {
      console.error('Sender wallet error:', walletError)
      return new Response(
        JSON.stringify({ error: 'Sender wallet not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (senderWallet.balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        recipient_id: recipient.id,
        transaction_type: 'send',
        amount,
        description,
        status: 'completed',
        reference: `PAE-${Date.now()}`
      })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update sender's wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: senderWallet.balance - amount })
      .eq('id', senderWallet.id)

    if (updateError) {
      console.error('Wallet update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update wallet balance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create recipient transaction
    const { error: recipientTransactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: recipient.id,
        transaction_type: 'deposit',
        amount,
        description: `Received from ${recipientEmail}`,
        status: 'completed',
        reference: `REC-${Date.now()}`
      })

    if (recipientTransactionError) {
      console.error('Recipient transaction error:', recipientTransactionError)
    }

    // Update recipient's wallet balance
    const { data: recipientWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', recipient.id)
      .eq('currency', 'NGN')
      .single()

    if (recipientWallet) {
      await supabase
        .from('wallets')
        .update({ balance: recipientWallet.balance + amount })
        .eq('id', recipientWallet.id)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send money error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
