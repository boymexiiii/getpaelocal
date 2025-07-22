import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VTUBillRequest {
  billType: 'airtime' | 'data' | 'electricity';
  serviceId: string;
  amount: number;
  phone?: string;
  meterNumber?: string;
  dataPlan?: string;
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
      billType,
      serviceId,
      amount,
      phone,
      meterNumber,
      dataPlan,
      userId
    }: VTUBillRequest = await req.json()

    console.log('Processing VTU bill payment:', {
      billType,
      serviceId,
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
      throw new Error('Insufficient balance for this bill payment')
    }

    // Get VTUPass credentials
    const vtupassApiKey = Deno.env.get('VTUPASS_API_KEY') || 'e692505419d5e965b02609f88a808de2';
    if (!vtupassApiKey) {
      throw new Error('VTUPass API key not configured');
    }

    // Generate unique request ID
    const requestId = `VTUPASS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let vtupassEndpoint = '';
    let vtupassPayload: any = {
      request_id: requestId,
      serviceID: serviceId,
      amount: amount,
    };

    // Set endpoint and payload based on bill type
    switch (billType) {
      case 'airtime':
        vtupassEndpoint = 'https://vtupass.com/api/pay';
        vtupassPayload.phone = phone;
        break;
      case 'data':
        vtupassEndpoint = 'https://vtupass.com/api/pay';
        vtupassPayload.phone = phone;
        vtupassPayload.data_plan = dataPlan || 'default';
        break;
      case 'electricity':
        vtupassEndpoint = 'https://vtupass.com/api/pay';
        vtupassPayload.meter_number = meterNumber;
        break;
      default:
        throw new Error('Invalid bill type');
    }

    // Make VTUPass API request
    const vtupassResponse = await fetch(vtupassEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': vtupassApiKey,
      },
      body: JSON.stringify(vtupassPayload)
    });

    const vtupassData = await vtupassResponse.json();

    if (!vtupassResponse.ok || vtupassData.status !== 'success') {
      throw new Error(vtupassData.message || 'Bill payment failed');
    }

    // Update wallet balance
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id);

    if (updateError) {
      throw new Error('Failed to update wallet balance');
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'bill_payment',
        amount,
        currency: 'NGN',
        description: `${billType.toUpperCase()} payment - ${serviceId} - ${phone || meterNumber}`,
        status: 'completed',
        reference: requestId,
        recipient_id: null
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      throw new Error('Failed to create transaction record');
    }

    // Send bill payment email notification
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
            type: 'bill_payment',
            to: profile.email,
            data: {
              userName: profile.first_name || 'User',
              amount: transaction.amount,
              currency: '₦',
              billType,
              billRef: serviceId,
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
        message: `${billType.toUpperCase()} payment of ₦${amount.toLocaleString()} completed successfully`,
        data: {
          requestId: vtupassData.request_id || requestId,
          vtupassReference: vtupassData.request_id || requestId,
          amount,
          billType,
          serviceId,
          phone: phone || null,
          meterNumber: meterNumber || null,
          transactionId: transaction.id,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('VTU bill payment error:', error)
    // Send bill payment failed email notification
    try {
      const { billType, serviceId, amount, userId } = typeof error === 'object' && error && error.requestData ? error.requestData : {};
      if (billType && serviceId && amount && userId) {
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
              type: 'bill_payment',
              to: profile.email,
              data: {
                userName: profile.first_name || 'User',
                amount,
                currency: '₦',
                billType,
                billRef: serviceId,
                transactionId: null,
                timestamp: new Date().toISOString(),
                status: 'failed'
              }
            })
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send bill payment failed email:', notifError);
    }
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Bill payment failed. Please try again.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})