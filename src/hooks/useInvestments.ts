
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Investment {
  id: string;
  asset_type: string;
  amount: number;
  purchase_price: number;
  current_value: number;
  created_at: string;
}

// Mock crypto prices - in production, you'd fetch from a real API
const mockPrices = {
  BTC: 45000,
  ETH: 3000,
  USDT: 1
};

export const useInvestments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  const fetchInvestments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching investments:', error);
    } else {
      setInvestments(data || []);
    }
    setLoading(false);
  };

  const buyAsset = async (assetType: string, amountInNGN: number) => {
    if (!user) return { error: 'User not authenticated' };

    const currentPrice = mockPrices[assetType as keyof typeof mockPrices];
    const assetAmount = amountInNGN / currentPrice;

    const { error } = await supabase
      .from('investments')
      .insert([
        {
          user_id: user.id,
          asset_type: assetType,
          amount: assetAmount,
          purchase_price: currentPrice,
          current_value: amountInNGN
        }
      ]);

    if (error) {
      return { error: error.message };
    }

    fetchInvestments();
    return { error: null };
  };

  const getTotalValue = () => {
    return investments.reduce((total, inv) => total + (inv.current_value || 0), 0);
  };

  return {
    investments,
    loading,
    buyAsset,
    getTotalValue,
    refetch: fetchInvestments
  };
};
