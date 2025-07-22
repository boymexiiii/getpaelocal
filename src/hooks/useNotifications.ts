import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
}

interface TransactionNotificationData extends NotificationData {
  transactionType: string;
  amount: number;
  currency: string;
  recipient?: string;
  transactionId: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
}

interface OTPNotificationData extends NotificationData {
  otpCode: string;
  purpose: string;
  expiryMinutes?: number;
}

export const useNotifications = () => {
  // Send comprehensive notification (email, SMS, push)
  const sendRealTimeNotification = async (data: {
    userId: string;
    type: 'transaction' | 'kyc_update' | 'security_alert' | 'payment_received' | 'wallet_funded';
    title: string;
    message: string;
    data?: any;
    channels?: ('email' | 'sms' | 'push')[];
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-real-time-notification', {
        body: data
      });

      if (error) {
        console.error('Failed to send real-time notification:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Real-time notification error:', error);
      return false;
    }
  };

  const sendTransactionEmail = async (data: TransactionNotificationData) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'transaction',
          to: data.userEmail,
          data: {
            userName: data.userName,
            transactionType: data.transactionType,
            amount: data.amount,
            currency: data.currency,
            recipient: data.recipient,
            transactionId: data.transactionId,
            timestamp: data.timestamp,
            status: data.status
          }
        }
      });

      if (error) {
        console.error('Failed to send transaction email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Transaction email error:', error);
      return false;
    }
  };

  const sendTransactionSMS = async (data: TransactionNotificationData) => {
    if (!data.userPhone) return false;

    try {
      const message = `Pae Alert: Your ${data.transactionType} of ${data.currency}${data.amount.toLocaleString()} was ${data.status}. Ref: ${data.transactionId.slice(0, 8)}`;

      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: data.userPhone,
          message,
          type: 'alert'
        }
      });

      if (error) {
        console.error('Failed to send transaction SMS:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Transaction SMS error:', error);
      return false;
    }
  };

  const sendOTPEmail = async (data: OTPNotificationData) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'otp',
          to: data.userEmail,
          data: {
            userName: data.userName,
            otpCode: data.otpCode,
            purpose: data.purpose,
            expiryMinutes: data.expiryMinutes || 10
          }
        }
      });

      if (error) {
        console.error('Failed to send OTP email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('OTP email error:', error);
      return false;
    }
  };

  const sendOTPSMS = async (data: OTPNotificationData) => {
    if (!data.userPhone) return false;

    try {
      const message = `Your Pae verification code is: ${data.otpCode}. Valid for ${data.expiryMinutes || 10} minutes. Do not share this code.`;

      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: data.userPhone,
          message,
          type: 'otp'
        }
      });

      if (error) {
        console.error('Failed to send OTP SMS:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('OTP SMS error:', error);
      return false;
    }
  };

  const sendKYCUpdateNotification = async (data: NotificationData & { status: string; reason?: string }) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'kyc_update',
          to: data.userEmail,
          data: {
            userName: data.userName,
            status: data.status,
            reason: data.reason
          }
        }
      });

      if (error) {
        console.error('Failed to send KYC update:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('KYC update error:', error);
      return false;
    }
  };

  const sendSecurityAlert = async (data: NotificationData & { alertType: string; message: string }) => {
    try {
      const timestamp = new Date().toISOString();

      // Send email alert
      const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'security_alert',
          to: data.userEmail,
          data: {
            userName: data.userName,
            alertType: data.alertType,
            message: data.message,
            timestamp
          }
        }
      });

      // Send SMS alert if phone available
      if (data.userPhone) {
        const smsMessage = `Pae Security Alert: ${data.alertType}. ${data.message}. If this wasn't you, contact support immediately.`;
        
        await supabase.functions.invoke('send-sms', {
          body: {
            to: data.userPhone,
            message: smsMessage,
            type: 'alert'
          }
        });
      }

      return !emailError;
    } catch (error) {
      console.error('Security alert error:', error);
      return false;
    }
  };

  // New notification email triggers
  const sendWithdrawalEmail = async (data: TransactionNotificationData) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'withdrawal',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send withdrawal email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Withdrawal email error:', error);
      return false;
    }
  };

  const sendPaymentSentEmail = async (data: TransactionNotificationData) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'payment_sent',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send payment sent email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Payment sent email error:', error);
      return false;
    }
  };

  const sendPaymentReceivedEmail = async (data: TransactionNotificationData & { sender: string }) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'payment_received',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send payment received email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Payment received email error:', error);
      return false;
    }
  };

  const sendBillPaymentEmail = async (data: TransactionNotificationData & { billType: string; billRef: string }) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'bill_payment',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send bill payment email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Bill payment email error:', error);
      return false;
    }
  };

  const sendPaymentFailedEmail = async (data: TransactionNotificationData & { reason?: string }) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'payment_failed',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send payment failed email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Payment failed email error:', error);
      return false;
    }
  };

  const sendWelcomeEmail = async (data: NotificationData) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'welcome',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send welcome email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Welcome email error:', error);
      return false;
    }
  };

  const sendAccountChangedEmail = async (data: NotificationData & { changeType: string; timestamp: string }) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'account_changed',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send account changed email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Account changed email error:', error);
      return false;
    }
  };

  const sendAccountClosureEmail = async (data: NotificationData & { timestamp: string }) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'account_closure',
          to: data.userEmail,
          data
        }
      });
      if (error) {
        console.error('Failed to send account closure email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Account closure email error:', error);
      return false;
    }
  };

  return {
    sendRealTimeNotification,
    sendTransactionEmail,
    sendTransactionSMS,
    sendOTPEmail,
    sendOTPSMS,
    sendKYCUpdateNotification,
    sendSecurityAlert,
    sendWithdrawalEmail,
    sendPaymentSentEmail,
    sendPaymentReceivedEmail,
    sendBillPaymentEmail,
    sendPaymentFailedEmail,
    sendWelcomeEmail,
    sendAccountChangedEmail,
    sendAccountClosureEmail
  };
};