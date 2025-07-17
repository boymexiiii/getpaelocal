
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BillProvider {
  id: string;
  name: string;
  category: string;
  logo?: string;
}

interface BillPaymentResult {
  success: boolean;
  error?: string;
  reference?: string;
}

const BILL_PROVIDERS: BillProvider[] = [
  // Electricity
  { id: 'eko-electric', name: 'Eko Electricity', category: 'electricity' },
  { id: 'ikeja-electric', name: 'Ikeja Electric', category: 'electricity' },
  { id: 'abuja-electric', name: 'Abuja Electricity', category: 'electricity' },
  { id: 'kano-electric', name: 'Kano Electricity', category: 'electricity' },
  { id: 'phed-electric', name: 'Port Harcourt Electric', category: 'electricity' },
  { id: 'eedc-electric', name: 'Enugu Electric', category: 'electricity' },
  { id: 'ibedc-electric', name: 'Ibadan Electric', category: 'electricity' },
  { id: 'jos-electric', name: 'Jos Electric', category: 'electricity' },
  { id: 'kaduna-electric', name: 'Kaduna Electric', category: 'electricity' },
  { id: 'yola-electric', name: 'Yola Electric', category: 'electricity' },
  { id: 'benin-electric', name: 'Benin Electric', category: 'electricity' },
  
  // Internet
  { id: 'mtn-data', name: 'MTN Data', category: 'internet' },
  { id: 'airtel-data', name: 'Airtel Data', category: 'internet' },
  { id: 'glo-data', name: 'Glo Data', category: 'internet' },
  { id: '9mobile-data', name: '9mobile Data', category: 'internet' },
  
  // TV
  { id: 'dstv', name: 'DStv', category: 'tv' },
  { id: 'gotv', name: 'GOtv', category: 'tv' },
  { id: 'startimes', name: 'StarTimes', category: 'tv' },
  
  // Airtime
  { id: 'mtn-airtime', name: 'MTN Airtime', category: 'airtime' },
  { id: 'airtel-airtime', name: 'Airtel Airtime', category: 'airtime' },
  { id: 'glo-airtime', name: 'Glo Airtime', category: 'airtime' },
  { id: '9mobile-airtime', name: '9mobile Airtime', category: 'airtime' },
];

export const useBillPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getBillProviders = (category?: string): BillProvider[] => {
    if (category) {
      return BILL_PROVIDERS.filter(provider => provider.category === category);
    }
    return BILL_PROVIDERS;
  };

  const payBill = async (
    providerId: string,
    amount: number,
    accountNumber: string,
    customerName?: string
  ): Promise<BillPaymentResult> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    const provider = BILL_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return { success: false, error: 'Invalid bill provider' };

    setLoading(true);
    try {
      // Check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', 'NGN')
        .single();

      if (walletError || !wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      if (wallet.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Determine bill type and service ID based on provider
      let billType: 'airtime' | 'data' | 'electricity' = 'electricity';
      let serviceId = providerId;
      
      if (provider.category === 'airtime') billType = 'airtime';
      if (provider.category === 'internet') billType = 'data';
      
      // Call VTU.ng API
      const { data, error: vtuError } = await supabase.functions.invoke('vtu-bills', {
        body: {
          billType,
          serviceId,
          amount,
          phone: billType === 'airtime' || billType === 'data' ? accountNumber : undefined,
          meterNumber: billType === 'electricity' ? accountNumber : undefined,
          dataPlan: billType === 'data' ? 'default' : undefined,
          userId: user.id
        }
      });

      if (vtuError || !data.success) {
        const errorMessage = vtuError?.message || data.error || 'Bill payment failed';
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Payment Successful",
        description: `${provider.name} payment completed successfully`,
      });

      return { success: true, reference: data.data.requestId };
    } catch (error) {
      console.error('Bill payment error:', error);
      return { success: false, error: 'Payment failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const validateAccount = async (providerId: string, accountNumber: string): Promise<{ valid: boolean; customerName?: string }> => {
    // Mock validation - in production, integrate with actual bill provider APIs
    const provider = BILL_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return { valid: false };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation logic
    if (accountNumber.length >= 10) {
      return { 
        valid: true, 
        customerName: `Customer for ${accountNumber}` 
      };
    }

    return { valid: false };
  };

  return {
    loading,
    getBillProviders,
    payBill,
    validateAccount
  };
};
