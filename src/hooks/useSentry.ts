
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setUserContext, addBreadcrumb, captureException, captureMessage } from '@/utils/sentry';
import { useMonitoringAlerts } from '@/hooks/useMonitoringAlerts';

export const useSentry = () => {
  const { user } = useAuth();
  const { createAlert } = useMonitoringAlerts();

  useEffect(() => {
    if (user) {
      // Set user context in Sentry
      setUserContext({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.first_name || user.user_metadata?.full_name,
      });

      addBreadcrumb(`User logged in: ${user.email}`, 'auth', 'info');
    }
  }, [user]);

  const logError = async (error: Error, context?: Record<string, any>) => {
    // Capture with Sentry
    captureException(error, context);
    
    // Create monitoring alert for critical errors
    if (user) {
      await createAlert(
        'system_error',
        'high',
        'Application Error',
        `Error: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
        }
      );
    }
  };

  const logMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    captureMessage(message, level);
    addBreadcrumb(message, 'custom', level);
  };

  const logTransaction = (transactionType: string, amount: number, status: string) => {
    addBreadcrumb(
      `Transaction: ${transactionType} - ${amount} - ${status}`,
      'transaction',
      status === 'failed' ? 'error' : 'info'
    );

    if (status === 'failed') {
      logMessage(`Transaction failed: ${transactionType} for amount ${amount}`, 'warning');
    }
  };

  const logUserAction = (action: string, details?: Record<string, any>) => {
    addBreadcrumb(`User action: ${action}`, 'user', 'info');
    
    if (details) {
      captureMessage(`User performed: ${action}`, 'info');
    }
  };

  return {
    logError,
    logMessage,
    logTransaction,
    logUserAction,
  };
};
