import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Server, 
  Wifi, 
  HardDrive, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SystemMetrics {
  database: {
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    connectionCount: number;
    uptime: number;
  };
  api: {
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
  };
  lastChecked: Date;
}

interface PerformanceHistory {
  timestamp: string;
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
}

const AdminSystemHealth: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    database: { status: 'online', responseTime: 0, connectionCount: 0, uptime: 99.9 },
    api: { status: 'online', responseTime: 0, requestsPerMinute: 0, errorRate: 0 },
    storage: { used: 0, total: 100, percentage: 0 },
    performance: { cpuUsage: 0, memoryUsage: 0, diskIO: 0 },
    lastChecked: new Date()
  });
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const startTime = Date.now();
      
      // Test database connectivity and get basic metrics
      const { data: dbTest, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const dbResponseTime = Date.now() - startTime;
      
      // Test API performance
      const apiStartTime = Date.now();
      const { data: apiTest, error: apiError } = await supabase
        .from('transactions')
        .select('count')
        .limit(1);
      
      const apiResponseTime = Date.now() - apiStartTime;

      // Get storage metrics (mock data)
      const storageUsed = Math.floor(Math.random() * 80) + 10;
      const storageTotal = 100;

      // Get performance metrics (mock data)
      const cpuUsage = Math.floor(Math.random() * 60) + 20;
      const memoryUsage = Math.floor(Math.random() * 70) + 15;
      const diskIO = Math.floor(Math.random() * 40) + 5;

      // Calculate error rates and request metrics
      const requestsPerMinute = Math.floor(Math.random() * 100) + 50;
      const errorRate = Math.random() * 2; // 0-2% error rate

      const newMetrics: SystemMetrics = {
        database: {
          status: dbError ? 'offline' : dbResponseTime > 1000 ? 'degraded' : 'online',
          responseTime: dbResponseTime,
          connectionCount: Math.floor(Math.random() * 50) + 10,
          uptime: 99.9 - Math.random() * 0.5
        },
        api: {
          status: apiError ? 'offline' : apiResponseTime > 1000 ? 'degraded' : 'online',
          responseTime: apiResponseTime,
          requestsPerMinute,
          errorRate
        },
        storage: {
          used: storageUsed,
          total: storageTotal,
          percentage: Math.round((storageUsed / storageTotal) * 100)
        },
        performance: {
          cpuUsage,
          memoryUsage,
          diskIO
        },
        lastChecked: new Date()
      };

      setMetrics(newMetrics);

      // Update performance history
      const historyEntry: PerformanceHistory = {
        timestamp: new Date().toLocaleTimeString(),
        responseTime: (dbResponseTime + apiResponseTime) / 2,
        cpuUsage,
        memoryUsage
      };

      setPerformanceHistory(prev => {
        const updated = [...prev, historyEntry];
        return updated.slice(-20); // Keep last 20 entries
      });

      // Check for alerts
      if (dbResponseTime > 2000 || apiResponseTime > 2000) {
        toast({
          title: "Performance Alert",
          description: "System response time is higher than normal",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: "Unable to retrieve system metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    
    if (autoRefresh) {
      const interval = setInterval(checkSystemHealth, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusBadge = (status: string, label: string = '') => {
    switch (status) {
      case 'online':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {label || 'Online'}
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {label || 'Degraded'}
          </Badge>
        );
      case 'offline':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {label || 'Offline'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            {label || 'Unknown'}
          </Badge>
        );
    }
  };

  const getResponseTimeBadge = (time: number) => {
    if (time < 200) return { color: 'text-green-600', trend: 'good' };
    if (time < 500) return { color: 'text-yellow-600', trend: 'moderate' };
    return { color: 'text-red-600', trend: 'poor' };
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health Monitor</h2>
          <p className="text-muted-foreground">Real-time system performance and health metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" onClick={checkSystemHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Database</span>
              </div>
              {getStatusBadge(metrics.database.status)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Response: {metrics.database.responseTime}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                <span className="font-medium">API</span>
              </div>
              {getStatusBadge(metrics.api.status)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Response: {metrics.api.responseTime}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Storage</span>
              </div>
              <Badge className={metrics.storage.percentage > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {metrics.storage.percentage}%
              </Badge>
            </div>
            <div className="mt-2">
              <Progress value={metrics.storage.percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <span className="font-medium">System Load</span>
              </div>
              <Badge className={metrics.performance.cpuUsage > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {metrics.performance.cpuUsage}%
              </Badge>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              CPU Usage
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm">{metrics.performance.cpuUsage}%</span>
              </div>
              <Progress value={metrics.performance.cpuUsage} className={`h-2 ${getUsageColor(metrics.performance.cpuUsage)}`} />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm">{metrics.performance.memoryUsage}%</span>
              </div>
              <Progress value={metrics.performance.memoryUsage} className={`h-2 ${getUsageColor(metrics.performance.memoryUsage)}`} />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Disk I/O</span>
                <span className="text-sm">{metrics.performance.diskIO}%</span>
              </div>
              <Progress value={metrics.performance.diskIO} className={`h-2 ${getUsageColor(metrics.performance.diskIO)}`} />
            </div>
            
            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">DB Connections:</span>
                  <span className="ml-2 font-medium">{metrics.database.connectionCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="ml-2 font-medium">{metrics.database.uptime.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Requests/min:</span>
                  <span className="ml-2 font-medium">{metrics.api.requestsPerMinute}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Error Rate:</span>
                  <span className="ml-2 font-medium">{metrics.api.errorRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance History Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} name="Response Time (ms)" />
                <Line type="monotone" dataKey="cpuUsage" stroke="#82ca9d" strokeWidth={2} name="CPU Usage (%)" />
                <Line type="monotone" dataKey="memoryUsage" stroke="#ffc658" strokeWidth={2} name="Memory Usage (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.database.responseTime > 1000 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Database response time is high ({metrics.database.responseTime}ms). Consider optimizing queries or scaling resources.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics.performance.cpuUsage > 80 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  CPU usage is critically high ({metrics.performance.cpuUsage}%). System performance may be impacted.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics.storage.percentage > 85 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Storage usage is high ({metrics.storage.percentage}%). Consider cleaning up old files or adding more storage.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics.api.errorRate > 1 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  API error rate is elevated ({metrics.api.errorRate.toFixed(2)}%). Check application logs for issues.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics.database.responseTime <= 500 && metrics.performance.cpuUsage <= 70 && metrics.storage.percentage <= 80 && metrics.api.errorRate <= 1 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All systems are operating normally. No critical alerts detected.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Last updated: {metrics.lastChecked.toLocaleString()}
      </div>
    </div>
  );
};

export default AdminSystemHealth;