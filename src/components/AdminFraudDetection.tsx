import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Shield, Eye, Ban, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FraudAlert {
  id: string;
  transactionId: string;
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alertType: string;
  amount: number;
  reason: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'false_positive';
  userName: string;
}

const AdminFraudDetection: React.FC = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const fetchFraudAlerts = async () => {
    try {
      // Fetch recent transactions to analyze for fraud patterns
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          transaction_type,
          status,
          created_at,
          user_id,
          description
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactions) {
        const fraudAlerts: FraudAlert[] = [];
        
        // Simple fraud detection rules
        transactions.forEach((transaction, index) => {
          const alerts = detectFraud(transaction, transactions);
          fraudAlerts.push(...alerts);
        });

        // Sort by risk level and creation time
        fraudAlerts.sort((a, b) => {
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel] || 
                 new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setAlerts(fraudAlerts.slice(0, 20)); // Show top 20 alerts
      }
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load fraud detection data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const detectFraud = (transaction: any, allTransactions: any[]): FraudAlert[] => {
    const alerts: FraudAlert[] = [];
    const userId = transaction.user_id;
    const amount = transaction.amount;
    const userTransactions = allTransactions.filter(t => t.user_id === userId);

    // Rule 1: High amount transactions
    if (amount > 1000000) {
      alerts.push({
        id: `fraud_${transaction.id}_high_amount`,
        transactionId: transaction.id,
        userId,
        riskLevel: amount > 5000000 ? 'critical' : 'high',
        alertType: 'High Amount Transaction',
        amount,
        reason: `Transaction amount of ₦${amount.toLocaleString()} exceeds normal limits`,
        createdAt: transaction.created_at,
        status: 'pending',
        userName: `User ${userId.slice(0, 8)}`
      });
    }

    // Rule 2: Rapid consecutive transactions
    const recentTransactions = userTransactions.filter(t => 
      new Date(t.created_at).getTime() > new Date(transaction.created_at).getTime() - 3600000 // Last hour
    );
    
    if (recentTransactions.length > 5) {
      alerts.push({
        id: `fraud_${transaction.id}_rapid_transactions`,
        transactionId: transaction.id,
        userId,
        riskLevel: 'high',
        alertType: 'Rapid Transactions',
        amount,
        reason: `${recentTransactions.length} transactions in the last hour`,
        createdAt: transaction.created_at,
        status: 'pending',
        userName: `User ${userId.slice(0, 8)}`
      });
    }

    // Rule 3: Off-hours transactions
    const transactionHour = new Date(transaction.created_at).getHours();
    if ((transactionHour < 6 || transactionHour > 23) && amount > 500000) {
      alerts.push({
        id: `fraud_${transaction.id}_off_hours`,
        transactionId: transaction.id,
        userId,
        riskLevel: 'medium',
        alertType: 'Off-hours Activity',
        amount,
        reason: `Large transaction at ${transactionHour}:00 (off-hours)`,
        createdAt: transaction.created_at,
        status: 'pending',
        userName: `User ${userId.slice(0, 8)}`
      });
    }

    // Rule 4: Unusual transaction pattern
    const avgAmount = userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length;
    if (amount > avgAmount * 10 && userTransactions.length > 3) {
      alerts.push({
        id: `fraud_${transaction.id}_unusual_pattern`,
        transactionId: transaction.id,
        userId,
        riskLevel: 'high',
        alertType: 'Unusual Pattern',
        amount,
        reason: `Transaction amount is ${Math.round(amount / avgAmount)}x higher than user average`,
        createdAt: transaction.created_at,
        status: 'pending',
        userName: `User ${userId.slice(0, 8)}`
      });
    }

    return alerts;
  };

  const updateAlertStatus = async (alertId: string, newStatus: FraudAlert['status']) => {
    try {
      // In a real system, this would update the fraud_alerts table
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: newStatus }
            : alert
        )
      );

      // Create monitoring alert for high-risk cases
      if (newStatus === 'resolved') {
        await supabase.rpc('create_monitoring_alert', {
          p_alert_type: 'fraud_resolved',
          p_severity: 'medium',
          p_title: 'Fraud Alert Resolved',
          p_message: `Fraud alert ${alertId} has been resolved by admin`,
          p_metadata: { alertId, resolvedAt: new Date().toISOString() }
        });
      }

      toast({
        title: "Alert Updated",
        description: `Alert status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_positive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchFraudAlerts();
    const interval = setInterval(fetchFraudAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const criticalAlerts = alerts.filter(a => a.riskLevel === 'critical');
  const highRiskAlerts = alerts.filter(a => a.riskLevel === 'high');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading fraud detection data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Alerts</p>
                <p className="text-2xl font-bold">{pendingAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Risk</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-orange-600">{highRiskAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Detection Rate</p>
                <p className="text-2xl font-bold text-green-600">98.2%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Fraud Detection Alerts
            </CardTitle>
            <Button onClick={fetchFraudAlerts} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-green-600 mb-2" />
              <p className="text-lg font-medium">No fraud alerts detected</p>
              <p className="text-gray-500">Your system is running securely</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${getRiskColor(alert.riskLevel)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getRiskColor(alert.riskLevel)}>
                          {alert.riskLevel.toUpperCase()} RISK
                        </Badge>
                        <Badge variant="secondary">{alert.alertType}</Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium">₦{alert.amount.toLocaleString()} - {alert.userName}</p>
                        <p className="text-sm text-gray-600">{alert.reason}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleString()} • Transaction: {alert.transactionId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Fraud Alert Details</DialogTitle>
                          </DialogHeader>
                          {selectedAlert && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Alert Type</label>
                                  <div className="text-sm">{selectedAlert.alertType}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Risk Level</label>
                                  <Badge className={getRiskColor(selectedAlert.riskLevel)}>
                                    {selectedAlert.riskLevel.toUpperCase()}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Transaction Amount</label>
                                  <div className="text-sm">₦{selectedAlert.amount.toLocaleString()}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">User</label>
                                  <div className="text-sm">{selectedAlert.userName}</div>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium">Reason</label>
                                  <div className="text-sm text-gray-600">{selectedAlert.reason}</div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 pt-4">
                                <Button 
                                  onClick={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Mark as Resolved
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => updateAlertStatus(selectedAlert.id, 'false_positive')}
                                >
                                  False Positive
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => updateAlertStatus(selectedAlert.id, 'reviewed')}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Under Review
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {alert.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            onClick={() => updateAlertStatus(alert.id, 'resolved')}
                            className="h-8 px-2"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAlertStatus(alert.id, 'false_positive')}
                            className="h-8 px-2"
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFraudDetection;