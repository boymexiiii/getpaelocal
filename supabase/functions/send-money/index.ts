
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_TRANSFER_AMOUNT = 500000;
const MAX_TRANSFERS_PER_MINUTE = 3;

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

    const { recipientIdentifier, amount, description, userId } = await req.json()

    // Enforce minimum transfer amount
    if (typeof amount !== 'number' || amount < 10) {
      return new Response(
        JSON.stringify({ error: 'Minimum transfer amount is ₦10' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fraud check: block large transfers
    if (amount > MAX_TRANSFER_AMOUNT) {
      return new Response(
        JSON.stringify({ error: 'Transfer amount exceeds allowed limit. Please contact support.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    // Fraud check: block rapid transfers
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentTransfers } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('transaction_type', 'send')
      .gt('created_at', oneMinuteAgo);
    if (recentTransfers && recentTransfers > MAX_TRANSFERS_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: 'Too many transfers in a short period. Please wait and try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Send money request:', { recipientIdentifier, amount, description, userId })

    // Try to find recipient by email in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    let recipient = authData.users.find(user => user.email === recipientIdentifier)

    // If not found by email, try by username in profiles
    if (!recipient) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', recipientIdentifier)
        .single()
      if (profileData && profileData.id) {
        recipient = { id: profileData.id, email: recipientIdentifier }
      }
    }

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
        description: `Received from ${recipientIdentifier}`,
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

    // Notify sender and recipient (pseudo, replace with your notification logic)
    try {
      await supabase.functions.invoke('send-real-time-notification', {
        body: {
          userId: userId,
          type: 'wallet_transfer',
          title: 'Transfer Successful',
          message: `You sent ₦${amount.toLocaleString()} to ${recipientIdentifier}`,
          channels: ['push', 'email']
        }
      });
      await supabase.functions.invoke('send-real-time-notification', {
        body: {
          userId: recipient.id,
          type: 'wallet_transfer',
          title: 'You Received Money',
          message: `You received ₦${amount.toLocaleString()} from ${userId}`,
          channels: ['push', 'email']
        }
      });

      // Fetch sender and recipient profiles for email addresses
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', userId)
        .single();
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', recipient.id)
        .single();

      // Send payment_sent email to sender
      if (senderProfile && senderProfile.email) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'payment_sent',
            to: senderProfile.email,
            data: {
              userName: senderProfile.first_name || 'User',
              amount,
              currency: '₦',
              recipient: recipientProfile?.first_name || recipientIdentifier,
              transactionId: `PAE-${Date.now()}`,
              timestamp: new Date().toISOString(),
              status: 'completed'
            }
          })
        });
      }

      // Send payment_received email to recipient
      if (recipientProfile && recipientProfile.email) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'payment_received',
            to: recipientProfile.email,
            data: {
              userName: recipientProfile.first_name || 'User',
              amount,
              currency: '₦',
              sender: senderProfile?.first_name || 'Sender',
              transactionId: `REC-${Date.now()}`,
              timestamp: new Date().toISOString(),
              status: 'completed'
            }
          })
        });
      }
    } catch (notifError) {
      console.error('Failed to send transfer notification:', notifError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send money error:', error)
    return new Response(
      JSON.stringify({ error: error.message || error.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
