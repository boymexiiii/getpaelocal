
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

// Real crypto prices from CoinGecko API
const fetchCryptoPrices = async () => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }
    
    const data = await response.json();
    return {
      BTC: data.bitcoin?.usd || 45000,
      ETH: data.ethereum?.usd || 3000,
      USDT: data.tether?.usd || 1
    };
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    // Fallback to mock prices
    return {
      BTC: 45000,
      ETH: 3000,
      USDT: 1
    };
  }
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

    const currentPrices = await fetchCryptoPrices();
    const currentPrice = currentPrices[assetType as keyof typeof currentPrices];
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
