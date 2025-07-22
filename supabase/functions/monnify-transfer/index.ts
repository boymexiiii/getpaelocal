import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonnifyTransferRequest {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  narration: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      bankCode,
      accountNumber,
      accountName,
      amount,
      narration,
      userId
    }: MonnifyTransferRequest = await req.json()

    console.log('Processing Monnify transfer:', {
      bankCode,
      accountNumber,
      accountName,
      amount,
      userId
    })

    // Check user's NGN wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      throw new Error('User wallet not found')
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance for this transfer')
    }

    // Get Monnify credentials
    const monnifyApiKey = Deno.env.get('MONNIFY_API_KEY')
    const monnifySecretKey = Deno.env.get('MONNIFY_SECRET_KEY')
    const monnifyContractCode = Deno.env.get('MONNIFY_CONTRACT_CODE')

    if (!monnifyApiKey || !monnifySecretKey || !monnifyContractCode) {
      throw new Error('Monnify API credentials not configured')
    }

    // Encode credentials for Basic Auth
    const credentials = btoa(`${monnifyApiKey}:${monnifySecretKey}`)

    // Get access token
    const tokenResponse = await fetch('https://sandbox-api.monnify.com/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      }
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.responseBody?.accessToken) {
      throw new Error('Failed to get Monnify access token')
    }

    const accessToken = tokenData.responseBody.accessToken

    // Generate unique reference
    const reference = `MNF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Make transfer request
    const transferResponse = await fetch('https://sandbox-api.monnify.com/api/v2/disbursements/single', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        reference,
        narration,
        bankCode,
        accountNumber,
        currency: 'NGN',
        sourceAccountNumber: monnifyContractCode,
        destinationAccountName: accountName
      })
    })

    const transferData = await transferResponse.json()

    if (!transferResponse.ok || !transferData.requestSuccessful) {
      throw new Error(transferData.responseMessage || 'Transfer failed')
    }

    // Update wallet balance
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id)

    if (updateError) {
      throw new Error('Failed to update wallet balance')
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'bank_transfer',
        amount,
        currency: 'NGN',
        description: `Bank transfer to ${accountName} (${accountNumber}) - ${narration}`,
        status: 'completed',
        reference,
        recipient_id: null
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      throw new Error('Failed to create transaction record')
    }

    // Send withdrawal email notification
    if (transaction) {
      // Fetch user email from profiles
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('first_name, email')
        .eq('id', userId)
        .single();
      if (!profileError && profile && profile.email) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'withdrawal',
            to: profile.email,
            data: {
              userName: profile.first_name || 'User',
              amount: transaction.amount,
              currency: '₦',
              transactionId: transaction.id,
              timestamp: new Date().toISOString(),
              status: 'completed'
            }
          })
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `₦${amount.toLocaleString()} transferred successfully to ${accountName}`,
        data: {
          reference,
          amount,
          accountName,
          accountNumber,
          bankCode,
          transactionId: transaction.id,
          monnifyReference: transferData.responseBody.reference,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Monnify transfer error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed. Please try again.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})