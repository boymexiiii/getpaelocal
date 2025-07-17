import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSentry } from '@/hooks/useSentry';

interface StroWalletCard {
  success: boolean;
  message: string;
  response?: {
    name_on_card: string;
    card_id: number;
    card_created_date: string;
    card_type: string;
    card_brand: string;
    card_user_id: string;
    reference: number;
    card_status: string;
    customer_id: string;
  };
}

interface CreateStroCardParams {
  nameOnCard: string;
  amount: number;
  customerEmail: string;
  publicKey: string;
  mode?: 'sandbox' | 'production';
}

export const useStroWallet = () => {
  const { toast } = useToast();
  const { logError, logTransaction } = useSentry();
  const [loading, setLoading] = useState(false);

  const createVirtualCard = async (params: CreateStroCardParams): Promise<StroWalletCard | null> => {
    setLoading(true);
    
    try {
      const response = await fetch('https://strowallet.com/api/bitvcard/create-card/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_on_card: params.nameOnCard,
          card_type: 'visa',
          public_key: params.publicKey,
          amount: params.amount.toString(),
          customerEmail: params.customerEmail,
          mode: params.mode || 'sandbox'
        })
      });

      const data = await response.json();

      if (data.success) {
        logTransaction('strowallet_card_creation', params.amount, 'success');
        
        toast({
          title: "Virtual Card Created!",
          description: `Card created successfully with ID: ${data.response?.card_id}`,
        });
        
        return data;
      } else {
        throw new Error(data.message || 'Card creation failed');
      }
    } catch (error) {
      logError(error as Error, {
        step: 'strowallet_card_creation',
        params
      });
      
      logTransaction('strowallet_card_creation', params.amount, 'failed');
      
      toast({
        title: "Card Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create virtual card',
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createVirtualCard,
    loading
  };
};