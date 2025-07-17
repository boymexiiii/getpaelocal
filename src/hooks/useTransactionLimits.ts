
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TransactionLimits {
  id: string;
  daily_send_limit: number;
  daily_spend_limit: number;
  monthly_limit: number;
  kyc_level: number;
}

interface DailyUsage {
  sent_today: number;
  spent_today: number;
  month_total: number;
}

export const useTransactionLimits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<TransactionLimits | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ sent_today: 0, spent_today: 0, month_total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLimits();
      fetchDailyUsage();
    }
  }, [user]);

  const fetchLimits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transaction_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching transaction limits:', error);
        return;
      }

      setLimits(data);
    } catch (error) {
      console.error('Unexpected error fetching limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyUsage = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Get today's sent transactions
      const { data: sentToday } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .in('transaction_type', ['send', 'bill_payment'])
        .gte('created_at', today)
        .eq('status', 'completed');

      // Get this month's total
      const { data: monthTotal } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
        .eq('status', 'completed');

      const sent_today = sentToday?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const spent_today = sent_today; // For now, spent = sent
      const month_total = monthTotal?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      setDailyUsage({ sent_today, spent_today, month_total });
    } catch (error) {
      console.error('Error fetching daily usage:', error);
    }
  };

  const checkTransactionLimit = async (amount: number, type: 'send' | 'spend'): Promise<boolean> => {
    if (!limits) {
      toast({
        title: "Error",
        description: "Unable to verify transaction limits",
        variant: "destructive"
      });
      return false;
    }

    const limit = type === 'send' ? limits.daily_send_limit : limits.daily_spend_limit;
    const currentUsage = type === 'send' ? dailyUsage.sent_today : dailyUsage.spent_today;

    if (currentUsage + amount > limit) {
      toast({
        title: "Transaction Limit Exceeded",
        description: `Daily ${type} limit of ₦${limit.toLocaleString()} would be exceeded. Current usage: ₦${currentUsage.toLocaleString()}`,
        variant: "destructive"
      });
      return false;
    }

    if (dailyUsage.month_total + amount > limits.monthly_limit) {
      toast({
        title: "Monthly Limit Exceeded",
        description: `Monthly limit of ₦${limits.monthly_limit.toLocaleString()} would be exceeded. Current usage: ₦${dailyUsage.month_total.toLocaleString()}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  return {
    limits,
    dailyUsage,
    loading,
    checkTransactionLimit,
    refetch: () => {
      fetchLimits();
      fetchDailyUsage();
    }
  };
};
