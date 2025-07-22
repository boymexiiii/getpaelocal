import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VirtualCard {
  id: string;
  user_id: string;
  card_number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
  cardholder_name: string;
  reloadly_card_id: string;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  spending_limit?: number;
  balance: number; // Added to match usage in Cards.tsx
}

interface CreateCardParams {
  amount: number;
  currency: string;
  cardholderName: string;
}

interface CreateCardResult {
  success: boolean;
  error?: string;
  card?: VirtualCard;
}

interface FundCardResult {
  success: boolean;
  error?: string;
}

export const useVirtualCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cards:', error);
        toast({
          title: "Error",
          description: "Failed to fetch virtual cards",
          variant: "destructive"
        });
        setCards([]);
      } else {
        setCards((data || []).map((card: any) => ({
          id: card.id,
          user_id: card.user_id,
          card_number: card.card_number ?? '',
          cvv: card.cvv ?? '',
          expiry_month: card.expiry_month ?? '',
          expiry_year: card.expiry_year ?? '',
          cardholder_name: card.cardholder_name ?? '',
          reloadly_card_id: card.reloadly_card_id ?? '',
          currency: card.currency ?? 'NGN',
          status: card.status ?? 'active',
          created_at: card.created_at ?? '',
          updated_at: card.updated_at ?? '',
          spending_limit: card.spending_limit ?? undefined,
          balance: card.balance ?? 0,
        })));
      }
    } catch (error) {
      console.error('Unexpected error fetching cards:', error);
      setCards([]);
    }
    setLoading(false);
  };

  const createCard = async ({ amount, currency, cardholderName }: CreateCardParams): Promise<CreateCardResult> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);

      // Call UfitPay API to create virtual card
      console.log('Creating virtual card with params:', { amount, currency, cardholderName });
      
      const { data: cardData, error: apiError } = await supabase.functions.invoke('ufitpay-virtual-card', {
        body: {
          action: 'create',
          amount,
          currency,
          cardholderName,
          userId: user.id
        }
      });

      console.log('Card creation response:', { cardData, apiError });

      if (apiError) {
        console.error('API Error:', apiError);
        return { success: false, error: apiError.message || 'Failed to create virtual card' };
      }

      // Card is already stored by the edge function
      await fetchCards();
      toast({
        title: "Success",
        description: "Virtual card created successfully!",
      });

      return { success: true, card: {
        id: cardData.data?.id ?? '',
        user_id: cardData.data?.user_id ?? '',
        card_number: cardData.data?.card_number ?? '',
        cvv: cardData.data?.cvv ?? '',
        expiry_month: cardData.data?.expiry_month ?? '',
        expiry_year: cardData.data?.expiry_year ?? '',
        cardholder_name: cardData.data?.cardholder_name ?? '',
        reloadly_card_id: cardData.data?.reloadly_card_id ?? '',
        currency: cardData.data?.currency ?? 'NGN',
        status: cardData.data?.status ?? 'active',
        created_at: cardData.data?.created_at ?? '',
        updated_at: cardData.data?.updated_at ?? '',
        spending_limit: cardData.data?.spending_limit ?? undefined,
        balance: 0, // Initialize balance for newly created card
      }};
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const fundCard = async (cardId: string, amount: number): Promise<FundCardResult> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return { success: false, error: 'Card not found' };

      // Call UfitPay API to fund card
      const { error: apiError } = await supabase.functions.invoke('ufitpay-virtual-card', {
        body: {
          action: 'fund',
          cardId: card.reloadly_card_id,
          amount,
          userId: user.id
        }
      });

      if (apiError) {
        console.error('API Error:', apiError);
        return { success: false, error: 'Failed to fund card' };
      }

      // Update card balance in database
      const { error: dbError } = await supabase
        .from('virtual_cards')
        .update({ balance: card.balance + amount })
        .eq('id', cardId);

      if (dbError) {
        console.error('Database Error:', dbError);
        return { success: false, error: 'Failed to update card balance' };
      }

      await fetchCards();
      toast({
        title: "Success",
        description: "Card funded successfully!",
      });

      return { success: true };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const freezeCard = async (cardId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return false;

      // Call UfitPay API to freeze card
      const { error: apiError } = await supabase.functions.invoke('ufitpay-virtual-card', {
        body: {
          action: 'freeze',
          cardId: card.reloadly_card_id,
          userId: user.id
        }
      });

      if (apiError) {
        console.error('API Error:', apiError);
        return false;
      }

      // Update card status in database
      const { error: dbError } = await supabase
        .from('virtual_cards')
        .update({ status: 'frozen' })
        .eq('id', cardId);

      if (dbError) {
        console.error('Database Error:', dbError);
        return false;
      }

      await fetchCards();
      toast({
        title: "Success",
        description: "Card frozen successfully!",
      });

      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      return false;
    }
  };

  const unfreezeCard = async (cardId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return false;

      // Call UfitPay API to unfreeze card
      const { error: apiError } = await supabase.functions.invoke('ufitpay-virtual-card', {
        body: {
          action: 'unfreeze',
          cardId: card.reloadly_card_id,
          userId: user.id
        }
      });

      if (apiError) {
        console.error('API Error:', apiError);
        return false;
      }

      // Update card status in database
      const { error: dbError } = await supabase
        .from('virtual_cards')
        .update({ status: 'active' })
        .eq('id', cardId);

      if (dbError) {
        console.error('Database Error:', dbError);
        return false;
      }

      await fetchCards();
      toast({
        title: "Success",
        description: "Card unfrozen successfully!",
      });

      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      return false;
    }
  };

  return {
    cards,
    loading,
    createCard,
    fundCard,
    freezeCard,
    unfreezeCard,
    refetch: fetchCards
  };
};
