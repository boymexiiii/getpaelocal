import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function verifyFlutterwaveSignature(req: Request, secret: string): boolean {
  // Flutterwave sends a 'verif-hash' header for webhook signature
  const signature = req.headers.get('verif-hash')
  return signature === secret
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Flutterwave webhook received:', body)

    // Verify webhook signature
    const signature = req.headers.get('verif-hash')
    const secretHash = Deno.env.get('FLUTTERWAVE_WEBHOOK_SECRET')
    
    if (secretHash && signature !== secretHash) {
      console.error('Invalid webhook signature')
      return new Response('Unauthorized', { status: 401 })
    }

    const { event, data } = body

    if (!event || !data) {
      throw new Error('Invalid webhook payload')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event) {
      case 'charge.completed':
        await handleChargeCompleted(data, supabaseClient)
        break
      case 'transfer.completed':
        await handleTransferCompleted(data, supabaseClient)
        break
      case 'transfer.failed':
        await handleTransferFailed(data, supabaseClient)
        break
      case 'transfer.reversed':
        await handleTransferReversed(data, supabaseClient)
        break
      case 'bill.completed':
        await handleBillCompleted(data, supabaseClient)
        break
      case 'bill.failed':
        await handleBillFailed(data, supabaseClient)
        break
      default:
        console.log(`Unhandled event type: ${event}`)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})

async function handleChargeCompleted(data: any, supabaseClient: any) {
  console.log('Processing charge completed event:', data)
  
  const { id, reference, amount, customer, type, status } = data
  
  if (!reference) {
    console.error('No reference found in charge completed event')
    return
  }

  // Update transaction status
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('flw_reference', reference)
    .single()

  if (fetchError || !transaction) {
    console.error('Transaction not found for reference:', reference)
    return
  }

  // Update transaction status to completed
  const { error: updateError } = await supabaseClient
    .from('transactions')
    .update({ 
      status: 'completed',
      flw_response: JSON.stringify(data)
    })
    .eq('id', transaction.id)

  if (updateError) {
    console.error('Failed to update transaction:', updateError)
    return
  }

  // If transaction was pending, now debit the wallet
  if (transaction.status === 'pending') {
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found for user:', transaction.user_id)
      return
    }

    // Debit wallet
    const { error: debitError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - transaction.amount })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('Failed to debit wallet:', debitError)
      return
    }

    console.log(`Successfully debited ₦${transaction.amount} from user ${transaction.user_id}`)
  }

  // Send notification to user
  try {
    await supabaseClient.functions.invoke('send-real-time-notification', {
      body: {
        userId: transaction.user_id,
        title: 'Payment Successful',
        message: `Your ${type?.toLowerCase() || 'payment'} of ₦${amount} has been completed successfully.`,
        type: 'success'
      }
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }

  console.log(`Charge payment completed for reference: ${reference}`)
}

async function handleTransferCompleted(data: any, supabaseClient: any) {
  console.log('Processing transfer completed event:', data)
  
  const { id, reference, amount, customer, type, status } = data
  
  if (!reference) {
    console.error('No reference found in transfer completed event')
    return
  }

  // Update transaction status
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('flw_reference', reference)
    .single()

  if (fetchError || !transaction) {
    console.error('Transaction not found for reference:', reference)
    return
  }

  // Update transaction status to completed
  const { error: updateError } = await supabaseClient
    .from('transactions')
    .update({ 
      status: 'completed',
      flw_response: JSON.stringify(data)
    })
    .eq('id', transaction.id)

  if (updateError) {
    console.error('Failed to update transaction:', updateError)
    return
  }

  // If transaction was pending, now debit the wallet
  if (transaction.status === 'pending') {
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found for user:', transaction.user_id)
      return
    }

    // Debit wallet
    const { error: debitError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - transaction.amount })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('Failed to debit wallet:', debitError)
      return
    }

    console.log(`Successfully debited ₦${transaction.amount} from user ${transaction.user_id}`)
  }

  // Send notification to user
  try {
    await supabaseClient.functions.invoke('send-real-time-notification', {
      body: {
        userId: transaction.user_id,
        title: 'Transfer Successful',
        message: `Your ${type?.toLowerCase() || 'transfer'} of ₦${amount} has been completed successfully.`,
        type: 'success'
      }
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }

  console.log(`Transfer completed for reference: ${reference}`)
}

async function handleTransferFailed(data: any, supabaseClient: any) {
  console.log('Processing transfer failed event:', data)
  
  const { id, reference, amount, customer, type, status } = data
  
  if (!reference) {
    console.error('No reference found in transfer failed event')
    return
  }

  // Update transaction status
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('flw_reference', reference)
    .single()

  if (fetchError || !transaction) {
    console.error('Transaction not found for reference:', reference)
    return
  }

  // Update transaction status to failed
  const { error: updateError } = await supabaseClient
    .from('transactions')
    .update({ 
      status: 'failed',
      flw_response: JSON.stringify(data)
    })
    .eq('id', transaction.id)

  if (updateError) {
    console.error('Failed to update transaction:', updateError)
    return
  }

  // If wallet was already debited, refund the user
  if (transaction.status === 'completed') {
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found for user:', transaction.user_id)
      return
    }

    // Refund wallet
    const { error: refundError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance + transaction.amount })
      .eq('id', wallet.id)

    if (refundError) {
      console.error('Failed to refund wallet:', refundError)
      return
    }

    console.log(`Successfully refunded ₦${transaction.amount} to user ${transaction.user_id}`)
  }

  // Send notification to user
  try {
    await supabaseClient.functions.invoke('send-real-time-notification', {
      body: {
        userId: transaction.user_id,
        title: 'Transfer Failed',
        message: `Your ${type?.toLowerCase() || 'transfer'} of ₦${amount} has failed. Please try again.`,
        type: 'error'
      }
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }

  console.log(`Transfer failed for reference: ${reference}`)
}

async function handleTransferReversed(data: any, supabaseClient: any) {
  console.log('Processing transfer reversed event:', data)
  
  const { id, reference, amount, customer, type, status } = data
  
  if (!reference) {
    console.error('No reference found in transfer reversed event')
    return
  }

  // Update transaction status
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('flw_reference', reference)
    .single()

  if (fetchError || !transaction) {
    console.error('Transaction not found for reference:', reference)
    return
  }

  // Update transaction status to reversed
  const { error: updateError } = await supabaseClient
    .from('transactions')
    .update({ 
      status: 'reversed',
      flw_response: JSON.stringify(data)
    })
    .eq('id', transaction.id)

  if (updateError) {
    console.error('Failed to update transaction:', updateError)
    return
  }

  // If wallet was already debited, refund the user
  if (transaction.status === 'completed') {
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found for user:', transaction.user_id)
      return
    }

    // Refund wallet
    const { error: refundError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance + transaction.amount })
      .eq('id', wallet.id)

    if (refundError) {
      console.error('Failed to refund wallet:', refundError)
      return
    }

    console.log(`Successfully refunded ₦${transaction.amount} to user ${transaction.user_id}`)
  }

  // Send notification to user
  try {
    await supabaseClient.functions.invoke('send-real-time-notification', {
      body: {
        userId: transaction.user_id,
        title: 'Transfer Reversed',
        message: `Your ${type?.toLowerCase() || 'transfer'} of ₦${amount} has been reversed.`,
        type: 'info'
      }
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }

  console.log(`Transfer reversed for reference: ${reference}`)
}

async function handleBillCompleted(data: any, supabaseClient: any) {
  console.log('Processing bill completed event:', data)
  
  const { id, reference, amount, customer, type, status } = data
  
  if (!reference) {
    console.error('No reference found in bill completed event')
    return
  }

  // Update transaction status
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('flw_reference', reference)
    .single()

  if (fetchError || !transaction) {
    console.error('Transaction not found for reference:', reference)
    return
  }

  // Update transaction status to completed
  const { error: updateError } = await supabaseClient
    .from('transactions')
    .update({ 
      status: 'completed',
      flw_response: JSON.stringify(data)
    })
    .eq('id', transaction.id)

  if (updateError) {
    console.error('Failed to update transaction:', updateError)
    return
  }

  // If transaction was pending, now debit the wallet
  if (transaction.status === 'pending') {
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found for user:', transaction.user_id)
      return
    }

    // Debit wallet
    const { error: debitError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - transaction.amount })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('Failed to debit wallet:', debitError)
      return
    }

    console.log(`Successfully debited ₦${transaction.amount} from user ${transaction.user_id}`)
  }

  // Send notification to user
  try {
    await supabaseClient.functions.invoke('send-real-time-notification', {
      body: {
        userId: transaction.user_id,
        title: 'Bill Payment Successful',
        message: `Your ${type?.toLowerCase() || 'bill'} payment of ₦${amount} has been completed successfully.`,
        type: 'success'
      }
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }

  console.log(`Bill payment completed for reference: ${reference}`)
}

async function handleBillFailed(data: any, supabaseClient: any) {
  console.log('Processing bill failed event:', data)
  
  const { id, reference, amount, customer, type, status } = data
  
  if (!reference) {
    console.error('No reference found in bill failed event')
    return
  }

  // Update transaction status
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('flw_reference', reference)
    .single()

  if (fetchError || !transaction) {
    console.error('Transaction not found for reference:', reference)
    return
  }

  // Update transaction status to failed
  const { error: updateError } = await supabaseClient
    .from('transactions')
    .update({ 
      status: 'failed',
      flw_response: JSON.stringify(data)
    })
    .eq('id', transaction.id)

  if (updateError) {
    console.error('Failed to update transaction:', updateError)
    return
  }

  // If wallet was already debited, refund the user
  if (transaction.status === 'completed') {
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', 'NGN')
      .single()

    if (walletError || !wallet) {
      console.error('Wallet not found for user:', transaction.user_id)
      return
    }

    // Refund wallet
    const { error: refundError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance + transaction.amount })
      .eq('id', wallet.id)

    if (refundError) {
      console.error('Failed to refund wallet:', refundError)
      return
    }

    console.log(`Successfully refunded ₦${transaction.amount} to user ${transaction.user_id}`)
  }

  // Send notification to user
  try {
    await supabaseClient.functions.invoke('send-real-time-notification', {
      body: {
        userId: transaction.user_id,
        title: 'Bill Payment Failed',
        message: `Your ${type?.toLowerCase() || 'bill'} payment of ₦${amount} has failed. Please try again.`,
        type: 'error'
      }
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }

  console.log(`Bill payment failed for reference: ${reference}`)
} 