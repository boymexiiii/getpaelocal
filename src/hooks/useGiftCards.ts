import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GiftCard {
  id: string;
  name: string;
  brand: string;
  country: string;
  denominations: number[];
  minPrice: number;
  maxPrice: number;
  logoUrl: string | null;
  description: string;
  currency: string;
}

interface PurchaseGiftCardParams {
  productId: string;
  amount: number;
  quantity: number;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  customMessage?: string;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  data?: {
    orderId: string;
    productName: string;
    amount: number;
    quantity: number;
    recipientEmail: string;
    status: string;
    cardCode?: string;
    cardPin?: string;
    redemptionUrl?: string;
  };
}

export const useGiftCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cardtonic-gift-cards', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('Error fetching gift cards:', error);
        toast({
          title: "Error",
          description: "Failed to fetch gift cards",
          variant: "destructive"
        });
        setGiftCards([]);
      } else if (data.success) {
        setGiftCards(data.data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching gift cards:', error);
      setGiftCards([]);
    } finally {
      setLoading(false);
    }
  };

  const purchaseGiftCard = async ({
    productId,
    amount,
    quantity,
    recipientEmail,
    recipientName,
    senderName,
    customMessage
  }: PurchaseGiftCardParams): Promise<PurchaseResult> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cardtonic-gift-cards', {
        body: {
          action: 'purchase',
          productId,
          amount,
          quantity,
          recipientEmail,
          recipientName,
          senderName,
          customMessage,
          userId: user.id
        }
      });

      if (error) {
        console.error('Purchase error:', error);
        return { success: false, error: error.message || 'Purchase failed' };
      }

      if (data.success) {
        toast({
          title: "Purchase Successful",
          description: data.message,
        });
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || 'Purchase failed' };
      }
    } catch (error) {
      console.error('Unexpected purchase error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  return {
    giftCards,
    loading,
    fetchGiftCards,
    purchaseGiftCard
  };
};