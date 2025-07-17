
import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useTransactionLimits } from '@/hooks/useTransactionLimits';
import { useSentry } from '@/hooks/useSentry';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionRequest {
  amount: number;
  type: 'send' | 'bill_payment' | 'spend';
  description?: string;
  recipientEmail?: string;
  billType?: string;
  accountNumber?: string;
}

export const useWalletWithLimits = () => {
  const wallet = useWallet();
  const { user } = useAuth();
  const { checkTransactionLimit, limits, dailyUsage } = useTransactionLimits();
  const { logError, logTransaction } = useSentry();
  const { toast } = useToast();
  const { sendTransactionEmail, sendTransactionSMS } = useNotifications();

  const performTransactionWithLimitCheck = async (
    request: TransactionRequest
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Map bill_payment to spend for limit checking
      const limitType = request.type === 'bill_payment' ? 'spend' : request.type as 'send' | 'spend';
      
      // Check transaction limits first
      const canProceed = await checkTransactionLimit(request.amount, limitType);
      
      if (!canProceed) {
        logError(new Error('Transaction limit exceeded'), {
          amount: request.amount,
          type: request.type,
          limits,
          dailyUsage
        });
        return { success: false, error: 'Transaction limit exceeded' };
      }

      // Check wallet balance
      const ngnWallet = wallet.wallets.find(w => w.currency === 'NGN');
      if (!ngnWallet || ngnWallet.balance < request.amount) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough funds for this transaction",
          variant: "destructive"
        });
        return { success: false, error: 'Insufficient balance' };
      }

      // Perform the actual transaction
      let result;
      switch (request.type) {
        case 'send':
          if (!request.recipientEmail) {
            return { success: false, error: 'Recipient email required' };
          }
          result = await wallet.sendMoney(
            request.recipientEmail,
            request.amount,
            request.description || 'Money transfer'
          );
          break;
        
        case 'bill_payment':
          if (!request.billType || !request.accountNumber) {
            return { success: false, error: 'Bill type and account number required' };
          }
          result = await wallet.payBill(
            request.billType,
            request.amount,
            request.accountNumber
          );
          break;
        
        default:
          return { success: false, error: 'Unsupported transaction type' };
      }

      if (result.error) {
        logError(new Error(result.error), {
          transactionType: request.type,
          amount: request.amount
        });
        logTransaction(request.type, request.amount, 'failed');
        return { success: false, error: result.error };
      }

      // Log successful transaction
      logTransaction(request.type, request.amount, 'success');
      
      // Send notification for successful transaction
      if (user) {
        const notificationData = {
          userId: user.id,
          userName: user.user_metadata?.first_name || 'User',
          userEmail: user.email || '',
          userPhone: user.user_metadata?.phone,
          transactionType: request.type,
          amount: request.amount,
          currency: '₦',
          recipient: request.recipientEmail,
          transactionId: result.transactionId || 'unknown',
          timestamp: new Date().toLocaleString(),
          status: 'success' as const
        };

        // Send both email and SMS notifications
        sendTransactionEmail(notificationData);
        if (notificationData.userPhone) {
          sendTransactionSMS(notificationData);
        }
      }
      
      return { success: true };
    } catch (error) {
      logError(error as Error, {
        step: 'transaction_with_limits',
        request
      });
      return { success: false, error: 'Transaction failed' };
    }
  };

  const getAvailableLimit = (type: 'send' | 'spend'): number => {
    if (!limits) return 0;
    
    const limit = type === 'send' ? limits.daily_send_limit : limits.daily_spend_limit;
    const used = type === 'send' ? dailyUsage.sent_today : dailyUsage.spent_today;
    
    return Math.max(0, limit - used);
  };

  const canAfford = (amount: number): boolean => {
    const ngnWallet = wallet.wallets.find(w => w.currency === 'NGN');
    return ngnWallet ? ngnWallet.balance >= amount : false;
  };

  return {
    ...wallet,
    performTransactionWithLimitCheck,
    getAvailableLimit,
    canAfford,
    limits,
    dailyUsage
  };
};
