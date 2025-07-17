
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import AdminAnalytics from '@/components/AdminAnalytics';
import AdminDashboardStats from '@/components/AdminDashboardStats';
import AdminRealTimeStats from '@/components/AdminRealTimeStats';
import AdminUsersTab from '@/components/AdminUsersTab';
import AdminTransactionsTab from '@/components/AdminTransactionsTab';
import AdminKycTab from '@/components/AdminKycTab';
import AdminMonitoringTab from '@/components/AdminMonitoringTab';
import AdminFinancialReports from '@/components/AdminFinancialReports';
import AdminFraudDetection from '@/components/AdminFraudDetection';
import AdminAdvancedAnalytics from '@/components/AdminAdvancedAnalytics';
import AdminUserActivityTracker from '@/components/AdminUserActivityTracker';
import AdminSystemHealth from '@/components/AdminSystemHealth';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '@/hooks/useAdminData';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const { toast } = useToast();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { stats, users, transactions, kycApplications, loading: dataLoading, fetchAdminData } = useAdminData();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [role, loading, navigate, toast]);

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Status,KYC Level,Created At\n"
      + users.map(user => 
          `"${user.profiles?.first_name} ${user.profiles?.last_name}","${user.email}","${user.profiles?.is_verified ? 'Verified' : 'Unverified'}","${user.profiles?.kyc_level}","${new Date(user.created_at).toLocaleDateString()}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "User data has been exported successfully",
    });
  };

  const handleRefresh = async () => {
    await fetchAdminData();
    setLastRefresh(new Date());
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated",
    });
  };

  // Show loading while checking role or fetching data
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }
  if (role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen text-red-600 font-bold text-xl">Access Denied: Admins Only</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">
              Comprehensive system management and monitoring • Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={handleRefresh} variant="outline" disabled={dataLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
              {dataLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Real-time stats */}
        <AdminRealTimeStats />

        {/* Main stats */}
        <AdminDashboardStats stats={stats} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="activity">User Activity</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <AdminUsersTab users={users} onUserUpdate={fetchAdminData} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <AdminTransactionsTab transactions={transactions} />
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <AdminKycTab kycApplications={kycApplications} onDataUpdate={fetchAdminData} />
          </TabsContent>

          <TabsContent value="fraud" className="space-y-4">
            <AdminFraudDetection />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AdminAdvancedAnalytics />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <AdminUserActivityTracker />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <AdminSystemHealth />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <AdminFinancialReports />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
