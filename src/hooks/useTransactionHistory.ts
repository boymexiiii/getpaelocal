
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  reference: string;
  created_at: string;
}

export const useTransactionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch transaction history",
          variant: "destructive"
        });
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching transactions:', error);
      setTransactions([]);
    }
    setLoading(false);
  };

  const getTransactionsByType = (type: string): Transaction[] => {
    return transactions.filter(tx => tx.transaction_type === type);
  };

  const getTransactionsByStatus = (status: string): Transaction[] => {
    return transactions.filter(tx => tx.status === status);
  };

  const getTotalAmount = (type?: string): number => {
    const filteredTx = type ? getTransactionsByType(type) : transactions;
    return filteredTx
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  return {
    transactions,
    loading,
    refetch: fetchTransactions,
    getTransactionsByType,
    getTransactionsByStatus,
    getTotalAmount
  };
};
