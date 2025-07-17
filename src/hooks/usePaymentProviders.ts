
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PaymentProviderResult {
  success: boolean;
  error?: string;
  paymentUrl?: string;
  reference?: string;
}

export const usePaymentProviders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const initializePaystack = async (amount: number): Promise<PaymentProviderResult> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          amount,
          email: user.email,
          userId: user.id
        }
      });

      if (error) {
        console.error('Paystack initialize error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        paymentUrl: data.authorization_url,
        reference: data.reference
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: 'Failed to initialize payment' };
    } finally {
      setLoading(false);
    }
  };

  const initializeFlutterwave = async (amount: number): Promise<PaymentProviderResult> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('flutterwave-initialize', {
        body: {
          amount,
          email: user.email,
          userId: user.id,
          name: user.user_metadata?.first_name || 'User'
        }
      });

      if (error) {
        console.error('Flutterwave initialize error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        paymentUrl: data.payment_link,
        reference: data.reference
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: 'Failed to initialize payment' };
    } finally {
      setLoading(false);
    }
  };

  const verifyPaystackPayment = async (reference: string): Promise<PaymentProviderResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Send success notification
      if (data.success && user) {
        try {
          await supabase.functions.invoke('send-real-time-notification', {
            body: {
              userId: user.id,
              type: 'wallet_funded',
              title: 'Payment Successful',
              message: `Your wallet has been funded with ₦${data.amount?.toLocaleString()}`,
              channels: ['push', 'email']
            }
          });
        } catch (notifError) {
          console.error('Failed to send payment notification:', notifError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, error: 'Payment verification failed' };
    }
  };

  return {
    loading,
    initializePaystack,
    initializeFlutterwave,
    verifyPaystackPayment
  };
};
