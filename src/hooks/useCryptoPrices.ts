
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
}

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }
      
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cryptocurrency prices",
        variant: "destructive"
      });
      
      // Fallback to mock data
      setPrices([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 43000,
          price_change_percentage_24h: 2.5,
          market_cap: 850000000000,
          total_volume: 25000000000,
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2600,
          price_change_percentage_24h: -1.2,
          market_cap: 320000000000,
          total_volume: 15000000000,
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Refresh prices every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    prices,
    loading,
    refetch: fetchPrices
  };
};
