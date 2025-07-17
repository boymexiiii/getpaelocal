
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Wallet {
  id: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
}

interface SendMoneyResult {
  error: string | null;
}

interface AddMoneyResult {
  error: string | null;
  success?: boolean;
}

interface PayBillResult {
  error: string | null;
  success?: boolean;
  reference?: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchTransactions();
    }
  }, [user]);

  const fetchWallets = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching wallets:', error);
        setWallets([]);
      } else {
        setWallets(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching wallets:', error);
      setWallets([]);
    }
    setLoading(false);
  };

  const fetchTransactions = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const sendMoney = async (recipientEmail: string, amount: number, description: string): Promise<SendMoneyResult> => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Call edge function for sending money
      const { data, error } = await supabase.functions.invoke('send-money', {
        body: {
          recipientEmail,
          amount,
          description,
          userId: user.id
        }
      });

      if (error) {
        console.error('Send money error:', error);
        return { error: error.message || 'Failed to send money' };
      }

      await fetchWallets();
      await fetchTransactions();
      return { error: null };
    } catch (error) {
      console.error('Unexpected error in sendMoney:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const addMoney = async (amount: number, paymentMethod: string): Promise<AddMoneyResult> => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Call edge function for adding money
      const { data, error } = await supabase.functions.invoke('add-money', {
        body: {
          amount,
          paymentMethod,
          userId: user.id
        }
      });

      if (error) {
        console.error('Add money error:', error);
        return { error: error.message || 'Failed to add money' };
      }

      await fetchWallets();
      await fetchTransactions();
      return { error: null, success: true };
    } catch (error) {
      console.error('Unexpected error in addMoney:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const payBill = async (billType: string, amount: number, accountNumber: string): Promise<PayBillResult> => {
    if (!user) return { error: 'User not authenticated' };

    const ngnWallet = wallets.find(w => w.currency === 'NGN');
    if (!ngnWallet || ngnWallet.balance < amount) {
      return { error: 'Insufficient balance' };
    }

    try {
      const reference = `BILL-${billType.toUpperCase()}-${Date.now()}`;

      // Create bill payment transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'bill_payment',
          amount,
          description: `${billType} payment for ${accountNumber}`,
          status: 'completed',
          reference
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        return { error: transactionError.message };
      }

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: ngnWallet.balance - amount })
        .eq('id', ngnWallet.id);

      if (walletError) {
        console.error('Wallet update error:', walletError);
        return { error: 'Failed to update wallet balance' };
      }

      await fetchWallets();
      await fetchTransactions();
      return { error: null, success: true, reference };
    } catch (error) {
      console.error('Unexpected error in payBill:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const refetch = (): void => {
    fetchWallets();
    fetchTransactions();
  };

  return {
    wallets,
    transactions,
    loading,
    sendMoney,
    addMoney,
    payBill,
    refetch
  };
};
