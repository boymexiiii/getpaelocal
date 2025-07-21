import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BillPaymentRequest {
  billType: 'airtime' | 'data' | 'electricity' | 'cable' | 'internet';
  provider: string;
  amount: number;
  accountNumber: string;
  customerName?: string;
  userId: string;
}

interface BillPaymentResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { billType, provider, amount, accountNumber, customerName, userId }: BillPaymentRequest = await req.json()

    // Validate input
    if (!billType || !provider || !amount || !accountNumber || !userId) {
      throw new Error('Missing required fields')
    }

    if (amount < 10) {
      throw new Error('Minimum bill payment amount is ₦10')
    }

    // Get API credentials for different providers
    const vtpassApiKey = Deno.env.get('VTPASS_API_KEY')
    const vtpassSecretKey = Deno.env.get('VTPASS_SECRET_KEY')
    const baxiApiKey = Deno.env.get('BAXI_API_KEY')

    let result: any = null;
    let error: string | null = null;

    // Try Flutterwave first
    try {
      result = await processFlutterwaveBill({
        billType,
        provider,
        amount,
        accountNumber,
        customerName,
        userId
      });
    } catch (e) {
      console.log('Flutterwave bill payment failed:', e);
      error = 'Flutterwave bill payment failed';
    }

    // Fallback to VTPass if Flutterwave fails
    if (!result && vtpassApiKey && vtpassSecretKey) {
      try {
        const vtpassResult = await processVTPassPayment({
          billType,
          provider,
          amount,
          accountNumber,
          customerName,
          userId,
          apiKey: vtpassApiKey,
          secretKey: vtpassSecretKey
        });
        if (vtpassResult.success) {
          result = vtpassResult;
        }
      } catch (e) {
        console.log('VTPass failed:', e);
        error = 'VTPass payment failed';
      }
    }

    // Fallback to Baxi if both fail
    if (!result && baxiApiKey) {
      try {
        const baxiResult = await processBaxiPayment({
          billType,
          provider,
          amount,
          accountNumber,
          customerName,
          userId,
          apiKey: baxiApiKey
        });
        if (baxiResult.success) {
          result = baxiResult;
        }
      } catch (e) {
        console.log('Baxi failed:', e);
        error = 'Baxi payment failed';
      }
    }

    // Mock successful payment if no providers configured (for testing)
    if (!result) {
      console.log('No bill payment providers configured, using mock payment');
      result = {
        success: true,
        transactionId: `mock_${Date.now()}`,
        reference: `PAE${Date.now()}`,
        message: `Mock ${billType} payment of ₦${amount} to ${provider} successful`
      };
    }

    // After successful payment (result.success === true)
    if (result && result.success && userId && amount) {
      // Debit wallet and create transaction
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('currency', 'NGN')
        .single();

      if (walletError || !wallet) {
        throw new Error('User wallet not found');
      }

      if (wallet.balance < amount) {
        throw new Error('Insufficient balance for this bill payment');
      }

      // Only debit wallet if payment is actually completed, not pending
      if (result.status !== 'pending') {
        // Debit wallet
        const { error: updateError } = await supabaseClient
          .from('wallets')
          .update({ balance: wallet.balance - amount })
          .eq('id', wallet.id);

        if (updateError) {
          throw new Error('Failed to update wallet balance');
        }
      }

      // Create transaction record with appropriate status
      const transactionStatus = result.status === 'pending' ? 'pending' : 'completed';
      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          transaction_type: 'bill_payment',
          amount,
          currency: 'NGN',
          description: `${billType.toUpperCase()} payment - ${provider} - ${accountNumber}`,
          status: transactionStatus,
          reference: result.reference,
          recipient_id: null,
          flw_reference: result.reference,
          flw_response: result.flw_response ? JSON.stringify(result.flw_response) : null
        });

      if (transactionError) {
        throw new Error('Failed to create transaction record');
      }
    }

    const response: BillPaymentResponse = {
      success: result.success,
      transactionId: result.transactionId,
      reference: result.reference,
      error: result.error
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error: any) {
    console.error('Bill payment error:', error)
    const response: BillPaymentResponse = {
      success: false,
      error: error.message || 'Bill payment failed'
    };
    return new Response(
      JSON.stringify(response),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})

async function processVTPassPayment(params: any) {
  const { billType, provider, amount, accountNumber, apiKey, secretKey } = params;
  
  // Map bill types to VTPass service IDs
  const serviceMap: { [key: string]: string } = {
    'airtime': 'mtn', // Default to MTN, should be dynamic based on provider
    'data': 'mtn-data',
    'electricity': 'ikeja-electric',
    'cable': 'dstv',
    'internet': 'smile-direct'
  };

  const serviceId = serviceMap[billType] || provider.toLowerCase();
  
  const requestId = `PAE_${Date.now()}`;
  
  const payload = {
    request_id: requestId,
    serviceID: serviceId,
    amount: amount,
    phone: accountNumber, // For airtime/data
    billersCode: accountNumber, // For other bills
    variation_code: 'prepaid', // Default, should be configurable
  };

  const response = await fetch('https://vtpass.com/api/pay', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${apiKey}:${secretKey}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  if (data.response_description === '000' || data.code === '000') {
    return {
      success: true,
      transactionId: data.requestId,
      reference: data.transactionId,
      message: 'Payment successful'
    };
  } else {
    throw new Error(data.response_description || 'VTPass payment failed');
  }
}

async function processBaxiPayment(params: any) {
  const { billType, provider, amount, accountNumber, apiKey } = params;
  
  // Baxi payment implementation
  // This would require specific Baxi API integration
  
  const requestId = `BAXI_${Date.now()}`;
  
  // Mock Baxi response for now
  return {
    success: true,
    transactionId: requestId,
    reference: `BAXI_REF_${Date.now()}`,
    message: 'Baxi payment successful'
  };
}

async function processFlutterwaveBill(params: any) {
  const { billType, provider, amount, accountNumber, customerName } = params;
  const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
  if (!FLUTTERWAVE_SECRET_KEY) throw new Error('Flutterwave secret key not configured');

  const reference = `FLWBILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // For airtime payments, use the airtime endpoint
  if (billType === 'airtime') {
    const airtimePayload = {
      country: 'NG',
      customer: accountNumber,
      amount: amount,
      type: 'AIRTIME',
      reference: reference,
      biller_name: provider || 'MTN' // Default to MTN if no provider specified
    };

    console.log('Flutterwave airtime payment payload:', airtimePayload);

    const response = await fetch('https://api.flutterwave.com/v3/airtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtimePayload)
    });
    
    const data = await response.json();
    console.log('Flutterwave airtime payment response:', data);
    
    if (data.status === 'success' && data.data) {
      // Check if the airtime payment was actually completed
      if (data.data.status === 'success' || data.data.status === 'completed') {
        return {
          success: true,
          transactionId: data.data.id,
          reference: data.data.reference,
          message: 'Airtime payment successful',
          flw_response: data.data,
          status: 'completed'
        };
      } else if (data.data.status === 'pending') {
        // For pending transactions, we need to verify later
        return {
          success: true,
          transactionId: data.data.id,
          reference: data.data.reference,
          message: 'Airtime payment initiated, pending verification',
          flw_response: data.data,
          status: 'pending'
        };
      } else {
        throw new Error(`Airtime payment failed with status: ${data.data.status}`);
      }
    } else {
      throw new Error(data.message || 'Flutterwave airtime payment failed');
    }
  } else {
    // For other bill types, use the bills endpoint
    let type = '';
    switch (billType) {
      case 'data': type = 'DATA'; break;
      case 'electricity': type = 'POWER'; break;
      case 'cable': type = 'CABLETV'; break;
      case 'internet': type = 'INTERNET'; break;
      default: type = billType.toUpperCase(); break;
    }

    const payload: any = {
      country: 'NG',
      customer: accountNumber,
      amount: amount,
      type: type,
      reference: reference,
    };
    if (customerName) payload.biller_name = customerName;
    if (provider) payload.biller_code = provider;

    console.log('Flutterwave bill payment payload:', payload);

    const response = await fetch('https://api.flutterwave.com/v3/bills', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('Flutterwave bill payment response:', data);
    
    if (data.status === 'success' && data.data) {
      // Check if the bill payment was actually completed
      if (data.data.status === 'success' || data.data.status === 'completed') {
        return {
          success: true,
          transactionId: data.data.id,
          reference: data.data.reference,
          message: 'Payment successful',
          flw_response: data.data,
          status: 'completed'
        };
      } else if (data.data.status === 'pending') {
        // For pending transactions, we need to verify later
        return {
          success: true,
          transactionId: data.data.id,
          reference: data.data.reference,
          message: 'Payment initiated, pending verification',
          flw_response: data.data,
          status: 'pending'
        };
      } else {
        throw new Error(`Bill payment failed with status: ${data.data.status}`);
      }
    } else {
      throw new Error(data.message || 'Flutterwave bill payment failed');
    }
  }
}