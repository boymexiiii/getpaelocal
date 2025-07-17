
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as Sentry from '@sentry/react';

interface MonitoringAlert {
  id: string;
  alert_type: 'transaction_limit_reached' | 'suspicious_activity' | 'failed_payment' | 'kyc_pending' | 'security_breach' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  user_id: string | null;
  metadata: any;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export const useMonitoringAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching alerts:', error);
        return;
      }

      // Type cast to ensure proper types
      const typedAlerts = (data || []).map(alert => ({
        ...alert,
        alert_type: alert.alert_type as MonitoringAlert['alert_type'],
        severity: alert.severity as MonitoringAlert['severity']
      }));
      setAlerts(typedAlerts);
      setUnreadCount(typedAlerts.filter(alert => !alert.is_resolved).length);
    } catch (error) {
      console.error('Unexpected error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('monitoring_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'monitoring_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = {
            ...payload.new,
            alert_type: payload.new.alert_type as MonitoringAlert['alert_type'],
            severity: payload.new.severity as MonitoringAlert['severity']
          } as MonitoringAlert;
          setAlerts(prev => [newAlert, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification for high/critical alerts
          if (['high', 'critical'].includes(newAlert.severity)) {
            toast({
              title: newAlert.title,
              description: newAlert.message,
              variant: newAlert.severity === 'critical' ? 'destructive' : 'default',
              duration: 8000
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createAlert = async (
    alertType: MonitoringAlert['alert_type'],
    severity: MonitoringAlert['severity'],
    title: string,
    message: string,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('create_monitoring_alert', {
        p_alert_type: alertType,
        p_severity: severity,
        p_title: title,
        p_message: message,
        p_user_id: user.id,
        p_metadata: metadata || null
      });

      if (error) {
        console.error('Error creating alert:', error);
        // Log to Sentry
        Sentry.captureException(new Error(`Failed to create alert: ${error.message}`));
      }
    } catch (error) {
      console.error('Unexpected error creating alert:', error);
      // Log to Sentry
      Sentry.captureException(error as Error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('monitoring_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        console.error('Error resolving alert:', error);
        return;
      }

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
            : alert
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Unexpected error resolving alert:', error);
    }
  };

  const getAlertsByType = (type: MonitoringAlert['alert_type']) => {
    return alerts.filter(alert => alert.alert_type === type);
  };

  const getAlertsBySeverity = (severity: MonitoringAlert['severity']) => {
    return alerts.filter(alert => alert.severity === severity);
  };

  const getCriticalAlerts = () => {
    return alerts.filter(alert => alert.severity === 'critical' && !alert.is_resolved);
  };

  return {
    alerts,
    loading,
    unreadCount,
    createAlert,
    resolveAlert,
    getAlertsByType,
    getAlertsBySeverity,
    getCriticalAlerts,
    refetch: fetchAlerts
  };
};
