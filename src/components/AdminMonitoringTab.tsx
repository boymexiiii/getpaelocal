
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AlertsPanel from './AlertsPanel';

interface SystemHealth {
  database: 'online' | 'offline' | 'degraded';
  apiResponseTime: number;
  lastChecked: Date;
}

const AdminMonitoringTab: React.FC = () => {
  const { toast } = useToast();
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'online',
    apiResponseTime: 0,
    lastChecked: new Date()
  });
  const [checking, setChecking] = useState(false);

  const checkSystemHealth = async () => {
    setChecking(true);
    try {
      const startTime = Date.now();
      
      // Test database connectivity
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();
      
      const responseTime = Date.now() - startTime;
      
      setSystemHealth({
        database: error ? 'offline' : 'online',
        apiResponseTime: responseTime,
        lastChecked: new Date()
      });
    } catch (error) {
      setSystemHealth(prev => ({
        ...prev,
        database: 'offline',
        lastChecked: new Date()
      }));
      toast({
        title: "Health Check Failed",
        description: "Unable to connect to database",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getResponseTimeBadge = (time: number) => {
    if (time < 500) return <Badge className="bg-green-100 text-green-800">Fast ({time}ms)</Badge>;
    if (time < 1000) return <Badge className="bg-yellow-100 text-yellow-800">Moderate ({time}ms)</Badge>;
    return <Badge className="bg-red-100 text-red-800">Slow ({time}ms)</Badge>;
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <AlertsPanel />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSystemHealth}
              disabled={checking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>API Response Time</span>
              {getResponseTimeBadge(systemHealth.apiResponseTime)}
            </div>
            <div className="flex justify-between">
              <span>Database Status</span>
              {getHealthBadge(systemHealth.database)}
            </div>
            <div className="flex justify-between">
              <span>Payment Gateways</span>
              <Badge className="bg-green-100 text-green-800">Operational</Badge>
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Last checked: {systemHealth.lastChecked.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Shield className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-sm text-gray-500">No active security alerts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMonitoringTab;
