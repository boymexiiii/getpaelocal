import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FraudCheckRequest {
  userId: string;
  transactionType: string;
  amount: number;
  recipientInfo?: any;
  deviceInfo?: any;
  locationInfo?: any;
}

interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendations: string[];
  allowTransaction: boolean;
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
      transactionType, 
      amount, 
      recipientInfo,
      deviceInfo,
      locationInfo 
    }: FraudCheckRequest = await req.json()

    let riskScore = 0;
    const flags: string[] = [];
    const recommendations: string[] = [];

    // Get user's transaction history
    const { data: userTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get user profile and KYC status
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*, kyc_applications(*)')
      .eq('id', userId)
      .single();

    // Risk Factor 1: Transaction Amount Analysis
    if (userTransactions && userTransactions.length > 0) {
      const recentTransactions = userTransactions.slice(0, 10);
      const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
      
      if (amount > avgAmount * 5) {
        riskScore += 25;
        flags.push('Amount significantly higher than user average');
      }
      
      if (amount > 1000000) { // Over 1M NGN
        riskScore += 15;
        flags.push('Large transaction amount');
      }
    }

    // Risk Factor 2: Transaction Frequency
    if (userTransactions) {
      const today = new Date();
      const todayTransactions = userTransactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate.toDateString() === today.toDateString();
      });

      if (todayTransactions.length > 10) {
        riskScore += 20;
        flags.push('High transaction frequency today');
      }

      // Check for rapid successive transactions
      const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
      const recentTransactions = userTransactions.filter(t => 
        new Date(t.created_at) > last5Minutes
      );

      if (recentTransactions.length > 3) {
        riskScore += 30;
        flags.push('Multiple transactions in short time period');
      }
    }

    // Risk Factor 3: KYC Status
    if (!userProfile?.is_verified) {
      riskScore += 20;
      flags.push('User not KYC verified');
      recommendations.push('Require KYC verification before processing');
    }

    if (userProfile?.kyc_level < 2 && amount > 100000) {
      riskScore += 15;
      flags.push('Transaction amount exceeds KYC level limits');
    }

    // Risk Factor 4: Off-hours transactions
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
      flags.push('Transaction during off-hours');
    }

    // Risk Factor 5: New recipient (for transfers)
    if (transactionType === 'send' && recipientInfo) {
      const { data: previousToRecipient } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('recipient_id', recipientInfo.recipientId)
        .limit(1);

      if (!previousToRecipient || previousToRecipient.length === 0) {
        riskScore += 15;
        flags.push('First transaction to this recipient');
        recommendations.push('Consider additional verification for new recipients');
      }
    }

    // Risk Factor 6: Device/Location anomalies
    if (deviceInfo?.isNewDevice) {
      riskScore += 20;
      flags.push('Transaction from new device');
      recommendations.push('Verify device ownership');
    }

    if (locationInfo?.isNewLocation) {
      riskScore += 15;
      flags.push('Transaction from new location');
    }

    // Risk Factor 7: Failed recent transactions
    if (userTransactions) {
      const recentFailedTransactions = userTransactions
        .filter(t => t.status === 'failed')
        .slice(0, 5);

      if (recentFailedTransactions.length > 2) {
        riskScore += 25;
        flags.push('Multiple recent failed transactions');
      }
    }

    // Determine risk level and recommendation
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let allowTransaction = true;

    if (riskScore >= 80) {
      riskLevel = 'critical';
      allowTransaction = false;
      recommendations.push('Block transaction and require manual review');
    } else if (riskScore >= 60) {
      riskLevel = 'high';
      allowTransaction = false;
      recommendations.push('Require additional authentication (OTP, biometric)');
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
      recommendations.push('Apply additional monitoring and verification');
    } else {
      riskLevel = 'low';
    }

    // Log the fraud check
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'fraud_check_performed',
      new_data: {
        riskScore,
        riskLevel,
        flags,
        transactionType,
        amount
      }
    });

    // Create alert for high-risk transactions
    if (riskLevel === 'high' || riskLevel === 'critical') {
      await supabase.rpc('create_monitoring_alert', {
        p_alert_type: 'fraud_detection',
        p_severity: riskLevel === 'critical' ? 'critical' : 'high',
        p_title: `${riskLevel.toUpperCase()} Risk Transaction Detected`,
        p_message: `Transaction of ₦${amount.toLocaleString()} flagged with ${riskScore}% risk score`,
        p_user_id: userId,
        p_metadata: {
          riskScore,
          flags,
          transactionType,
          amount
        }
      });
    }

    const result: FraudCheckResult = {
      riskScore,
      riskLevel,
      flags,
      recommendations,
      allowTransaction
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Fraud detection error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Fraud detection failed',
        riskScore: 100,
        riskLevel: 'critical',
        flags: ['System error during fraud check'],
        recommendations: ['Manual review required'],
        allowTransaction: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})