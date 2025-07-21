import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  reference: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reference, userId }: VerifyRequest = await req.json()

    if (!reference || !userId) {
      throw new Error('Missing required fields: reference and userId')
    }

    const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY')
    if (!FLUTTERWAVE_SECRET_KEY) {
      throw new Error('Flutterwave secret key not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get transaction details
    const { data: transaction, error: txError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', userId)
      .single()

    if (txError || !transaction) {
      throw new Error('Transaction not found')
    }

    // Verify with Flutterwave API
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    console.log('Flutterwave verification response:', data)

    if (data.status === 'success' && data.data) {
      const flwData = data.data
      
      // Update transaction status based on Flutterwave response
      let newStatus = 'processing'
      if (flwData.status === 'successful' || flwData.status === 'completed') {
        newStatus = 'completed'
      } else if (flwData.status === 'failed' || flwData.status === 'cancelled') {
        newStatus = 'failed'
      } else if (flwData.status === 'pending') {
        newStatus = 'pending'
      }

      // Update transaction
      const { error: updateError } = await supabaseClient
        .from('transactions')
        .update({ 
          status: newStatus,
          flw_response: JSON.stringify(flwData)
        })
        .eq('id', transaction.id)

      if (updateError) {
        throw new Error('Failed to update transaction status')
      }

      // Handle wallet operations based on new status
      if (newStatus === 'completed' && transaction.status === 'pending') {
        // Debit wallet for completed transaction
        const { data: wallet, error: walletError } = await supabaseClient
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .eq('currency', 'NGN')
          .single()

        if (walletError || !wallet) {
          throw new Error('User wallet not found')
        }

        const { error: debitError } = await supabaseClient
          .from('wallets')
          .update({ balance: wallet.balance - transaction.amount })
          .eq('id', wallet.id)

        if (debitError) {
          throw new Error('Failed to debit wallet')
        }

        // Send success notification
        try {
          await supabaseClient.functions.invoke('send-real-time-notification', {
            body: {
              userId: userId,
              title: 'Payment Verified',
              message: `Your payment of ₦${transaction.amount} has been verified and completed successfully.`,
              type: 'success'
            }
          })
        } catch (error) {
          console.error('Failed to send notification:', error)
        }
      } else if (newStatus === 'failed' && transaction.status === 'completed') {
        // Refund wallet for failed transaction
        const { data: wallet, error: walletError } = await supabaseClient
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .eq('currency', 'NGN')
          .single()

        if (walletError || !wallet) {
          throw new Error('User wallet not found')
        }

        const { error: refundError } = await supabaseClient
          .from('wallets')
          .update({ balance: wallet.balance + transaction.amount })
          .eq('id', wallet.id)

        if (refundError) {
          throw new Error('Failed to refund wallet')
        }

        // Send failure notification
        try {
          await supabaseClient.functions.invoke('send-real-time-notification', {
            body: {
              userId: userId,
              title: 'Payment Failed',
              message: `Your payment of ₦${transaction.amount} has failed. Your wallet has been refunded.`,
              type: 'error'
            }
          })
        } catch (error) {
          console.error('Failed to send notification:', error)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: newStatus,
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            status: newStatus,
            reference: transaction.reference
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    } else {
      throw new Error(data.message || 'Failed to verify payment with Flutterwave')
    }

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment verification failed' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}) 