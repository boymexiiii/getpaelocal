import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RealTimeNotification {
  id: string;
  type: 'transaction' | 'kyc_update' | 'security_alert' | 'payment_received' | 'wallet_funded';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const playNotificationSound = useCallback((type: RealTimeNotification['type']) => {
    try {
      // Use a simple beep sound that works across browsers
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different notification types
      const frequencies = {
        transaction: 800,
        kyc_update: 600,
        security_alert: 1000,
        payment_received: 750,
        wallet_funded: 650,
      };
      
      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported or blocked');
    }
  }, []);

  const sendNotification = useCallback(async (
    type: RealTimeNotification['type'],
    title: string,
    message: string,
    data?: any,
    channels: ('email' | 'sms' | 'push')[] = ['push']
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('send-real-time-notification', {
        body: {
          userId: user.id,
          type,
          title,
          message,
          data,
          channels,
        },
      });

      if (error) {
        console.error('Failed to send notification:', error);
        toast({
          title: 'Notification Error',
          description: 'Failed to send notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Notification sending error:', error);
    }
  }, [user, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    // Create channels for both database changes and broadcast notifications
    const transactionChannel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const transaction = payload.new as Transaction;
          
          if (transaction.status === 'completed') {
            const isCredit = ['deposit', 'receive', 'wallet_funded'].includes(transaction.transaction_type);
            const notification: RealTimeNotification = {
              id: crypto.randomUUID(),
              type: isCredit ? 'payment_received' : 'transaction',
              title: isCredit ? "Money Received" : "Payment Successful",
              message: `${isCredit ? '+' : '-'}₦${transaction.amount.toLocaleString()} - ${transaction.description}`,
              data: transaction,
              timestamp: new Date().toISOString(),
              read: false,
            };
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)]);
            playNotificationSound(notification.type);
            
            toast({
              title: notification.title,
              description: notification.message,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const transaction = payload.new as Transaction;
          const oldTransaction = payload.old as Transaction;
          
          if (oldTransaction.status !== transaction.status) {
            let notification: RealTimeNotification;
            
            if (transaction.status === 'completed') {
              notification = {
                id: crypto.randomUUID(),
                type: 'transaction',
                title: "Transaction Completed",
                message: `${transaction.description} - ₦${transaction.amount.toLocaleString()}`,
                data: transaction,
                timestamp: new Date().toISOString(),
                read: false,
              };
              
              toast({
                title: notification.title,
                description: notification.message,
                duration: 5000,
              });
            } else if (transaction.status === 'failed') {
              notification = {
                id: crypto.randomUUID(),
                type: 'security_alert',
                title: "Transaction Failed",
                message: `${transaction.description} - ₦${transaction.amount.toLocaleString()}`,
                data: transaction,
                timestamp: new Date().toISOString(),
                read: false,
              };
              
              toast({
                title: notification.title,
                description: notification.message,
                variant: "destructive",
                duration: 5000,
              });
            } else {
              return;
            }
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)]);
            playNotificationSound(notification.type);
          }
        }
      )
      .subscribe();

    // Broadcast channel for custom notifications
    const broadcastChannel = supabase.channel(`user_${user.id}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        const notification = payload.payload as RealTimeNotification;
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        playNotificationSound(notification.type);
        
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });

        // Browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/lovable-uploads/61394b0e-fa0e-4b6f-a9fe-e79413ec7cfa.png',
            tag: notification.id,
          });
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(broadcastChannel);
      setIsConnected(false);
    };
  }, [user, toast, playNotificationSound]);

  // Request notification permission on first use
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const testNotification = useCallback(() => {
    const notification: RealTimeNotification = {
      id: crypto.randomUUID(),
      type: 'transaction',
      title: "Test Notification",
      message: "Real-time notifications are working!",
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 49)]);
    playNotificationSound('transaction');
    
    toast({
      title: notification.title,
      description: notification.message,
      duration: 3000,
    });
  }, [toast, playNotificationSound]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    sendNotification,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    testNotification,
  };
};