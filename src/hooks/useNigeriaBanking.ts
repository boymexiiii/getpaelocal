
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TransferData {
  bank_code: string;
  account_number: string;
  account_name: string;
  amount: number;
  narration: string;
}

interface TransferResult {
  success: boolean;
  error?: string;
  reference?: string;
}

interface USSDData {
  bank_code: string;
  ussd_code: string;
  instructions: string[];
}

interface NigeriaBankingResult {
  success: boolean;
  data?: any;
  error?: string;
  ussd_code?: string;
}

export const useNigeriaBanking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Nigerian banks data
  const nigerianBanks = [
    { code: '044', name: 'Access Bank', ussd: '*901#' },
    { code: '014', name: 'Afribank', ussd: '*901#' },
    { code: '023', name: 'Citibank', ussd: '*407#' },
    { code: '050', name: 'Ecobank', ussd: '*326#' },
    { code: '070', name: 'Fidelity Bank', ussd: '*770#' },
    { code: '011', name: 'First Bank', ussd: '*894#' },
    { code: '214', name: 'First City Monument Bank', ussd: '*329#' },
    { code: '058', name: 'GTBank', ussd: '*737#' },
    { code: '030', name: 'Heritage Bank', ussd: '*322#' },
    { code: '301', name: 'Jaiz Bank', ussd: '*389#' },
    { code: '082', name: 'Keystone Bank', ussd: '*7111#' },
    { code: '526', name: 'Parallex Bank', ussd: '*322#' },
    { code: '076', name: 'Polaris Bank', ussd: '*833#' },
    { code: '101', name: 'Providus Bank', ussd: '*737*6#' },
    { code: '221', name: 'Stanbic IBTC', ussd: '*909#' },
    { code: '068', name: 'Standard Chartered', ussd: '*977#' },
    { code: '232', name: 'Sterling Bank', ussd: '*822#' },
    { code: '032', name: 'Union Bank', ussd: '*826#' },
    { code: '033', name: 'United Bank for Africa', ussd: '*919#' },
    { code: '215', name: 'Unity Bank', ussd: '*7799#' },
    { code: '035', name: 'Wema Bank', ussd: '*945#' },
    { code: '057', name: 'Zenith Bank', ussd: '*966#' }
  ];

  const initiateDirectTransfer = async (transferData: TransferData): Promise<TransferResult> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setLoading(true);
    try {
      console.log('Initiating Monnify transfer:', transferData);
      
      const { data, error } = await supabase.functions.invoke('monnify-transfer', {
        body: {
          bankCode: transferData.bank_code,
          accountNumber: transferData.account_number,
          accountName: transferData.account_name,
          amount: transferData.amount,
          narration: transferData.narration,
          userId: user.id
        }
      });

      console.log('Monnify transfer response:', { data, error });

      if (error) {
        const errorMessage = error.message || 'Transfer failed. Please try again.';
        toast({
          title: "Transfer Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }

      if (data.success) {
        toast({
          title: "Transfer Successful",
          description: data.message,
        });
        return { success: true, reference: data.data.reference };
      } else {
        const errorMessage = data.error || 'Transfer failed. Please try again.';
        toast({
          title: "Transfer Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Monnify transfer error:', error);
      const errorMessage = 'Transfer failed. Please try again.';
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const createTransferRecipient = async (recipientData: Omit<TransferData, 'amount' | 'narration'>): Promise<NigeriaBankingResult> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-transfer-recipient', {
        body: {
          type: 'nuban',
          name: recipientData.account_name,
          account_number: recipientData.account_number,
          bank_code: recipientData.bank_code,
          currency: 'NGN',
          user_id: user.id
        }
      });

      if (error) {
        toast({
          title: "Recipient Creation Failed",
          description: error.message || "Failed to create transfer recipient",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Recipient Created",
        description: `${recipientData.account_name} has been added as a transfer recipient`,
      });

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create recipient';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getUSSDCode = (bankCode: string, amount?: number): USSDData | null => {
    const bank = nigerianBanks.find(b => b.code === bankCode);
    if (!bank) return null;

    const baseInstructions = [
      `Dial ${bank.ussd} on your phone`,
      'Select "Transfer" or "Send Money"',
      'Enter recipient account number',
      'Enter amount',
      'Enter your PIN to confirm'
    ];

    return {
      bank_code: bankCode,
      ussd_code: bank.ussd,
      instructions: amount 
        ? [...baseInstructions, `Amount: ₦${amount.toLocaleString()}`]
        : baseInstructions
    };
  };

  const verifyAccountNumber = async (bankCode: string, accountNumber: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-account-number', {
        body: { bank_code: bankCode, account_number: accountNumber }
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: "Cannot verify this account number",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Account verification failed' };
    } finally {
      setLoading(false);
    }
  };

  return {
    nigerianBanks,
    initiateDirectTransfer,
    createTransferRecipient,
    getUSSDCode,
    verifyAccountNumber,
    loading
  };
};
