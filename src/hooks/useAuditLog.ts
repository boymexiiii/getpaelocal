
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    if (!user) return;

    try {
      // Get client IP and user agent
      const ip_address = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      const user_agent = navigator.userAgent;

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          old_data: entry.old_data,
          new_data: entry.new_data,
          ip_address,
          user_agent
        });

      if (error) {
        console.error('Failed to log audit entry:', error);
      }
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  const logTransaction = async (action: string, transactionData: any) => {
    await logAction({
      action: `TRANSACTION_${action.toUpperCase()}`,
      table_name: 'transactions',
      record_id: transactionData.id,
      new_data: transactionData
    });
  };

  const logWalletUpdate = async (action: string, walletData: any, oldBalance?: number) => {
    await logAction({
      action: `WALLET_${action.toUpperCase()}`,
      table_name: 'wallets',
      record_id: walletData.id,
      old_data: oldBalance ? { balance: oldBalance } : null,
      new_data: walletData
    });
  };

  const logLogin = async () => {
    await logAction({
      action: 'USER_LOGIN'
    });
  };

  const logLogout = async () => {
    await logAction({
      action: 'USER_LOGOUT'
    });
  };

  return {
    logAction,
    logTransaction,
    logWalletUpdate,
    logLogin,
    logLogout
  };
};
