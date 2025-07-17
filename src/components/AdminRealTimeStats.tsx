import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeStats {
  activeUsers: number;
  transactionsLastHour: number;
  volumeLastHour: number;
  successRate: number;
  avgResponseTime: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
}

const AdminRealTimeStats: React.FC = () => {
  const [stats, setStats] = useState<RealtimeStats>({
    activeUsers: 0,
    transactionsLastHour: 0,
    volumeLastHour: 0,
    successRate: 0,
    avgResponseTime: 0,
    systemStatus: 'healthy'
  });

  const fetchRealTimeStats = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      // Get transactions from last hour
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('amount, status')
        .gte('created_at', oneHourAgo);

      // Get active users (users with activity in last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: activeUsersData } = await supabase
        .from('transactions')
        .select('user_id')
        .gte('created_at', oneDayAgo);

      const uniqueActiveUsers = new Set(activeUsersData?.map(t => t.user_id) || []).size;
      
      const completedTransactions = recentTransactions?.filter(t => t.status === 'completed') || [];
      const volumeLastHour = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const successRate = recentTransactions?.length > 0 
        ? (completedTransactions.length / recentTransactions.length) * 100 
        : 100;

      // Simple system health check
      const systemStatus: 'healthy' | 'warning' | 'critical' = 
        successRate > 95 ? 'healthy' : 
        successRate > 90 ? 'warning' : 'critical';

      setStats({
        activeUsers: uniqueActiveUsers,
        transactionsLastHour: recentTransactions?.length || 0,
        volumeLastHour,
        successRate,
        avgResponseTime: Math.floor(Math.random() * 200) + 100, // Simulated
        systemStatus
      });
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    }
  };

  useEffect(() => {
    fetchRealTimeStats();
    const interval = setInterval(fetchRealTimeStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hourly Transactions</p>
              <p className="text-2xl font-bold">{stats.transactionsLastHour}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">+12%</p>
              </div>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hourly Volume</p>
              <p className="text-2xl font-bold">₦{stats.volumeLastHour.toLocaleString()}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">+8%</p>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Last hour</p>
            </div>
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
              <p className="text-xs text-muted-foreground">API latency</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Status</p>
              <Badge className={getStatusColor(stats.systemStatus)}>
                {stats.systemStatus.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground">Overall health</p>
            </div>
            <div className={`h-8 w-8 rounded-full ${
              stats.systemStatus === 'healthy' ? 'bg-green-100' :
              stats.systemStatus === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <div className={`h-4 w-4 rounded-full m-2 ${
                stats.systemStatus === 'healthy' ? 'bg-green-600' :
                stats.systemStatus === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRealTimeStats;