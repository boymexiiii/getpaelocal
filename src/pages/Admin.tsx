
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
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminData } from '@/hooks/useAdminData';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import AdminWalletsTab from '@/components/AdminWalletsTab';

const ADMIN_EMAIL = 'info@getpae.com';

const DEMO_ROLES = ['superadmin', 'support', 'compliance'];

const Admin = () => {
  const { toast } = useToast();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get('tab') || 'overview';
  const { stats, users, transactions, kycApplications, loading: dataLoading, fetchAdminData } = useAdminData();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [adminRole, setAdminRole] = useState('superadmin');

  // Demo: allow role switching for testing
  const canView = useMemo(() => ({
    users: ['superadmin', 'support', 'compliance'].includes(adminRole),
    wallets: ['superadmin', 'support'].includes(adminRole),
    transactions: ['superadmin', 'support'].includes(adminRole),
    payouts: ['superadmin'].includes(adminRole),
    staff: ['superadmin'].includes(adminRole),
    kyc: ['superadmin', 'compliance'].includes(adminRole),
    config: ['superadmin'].includes(adminRole),
    system: ['superadmin'].includes(adminRole),
    support: ['superadmin', 'support'].includes(adminRole),
  }), [adminRole]);

  // Only allow access to admins or if admin code was entered
  useEffect(() => {
    const adminCodeEntered = sessionStorage.getItem('admin_authenticated') === 'true';
    if (!loading && role !== 'admin' && !adminCodeEntered) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive"
      });
      navigate('/admin-login');
    }
  }, [role, loading, navigate, toast]);

  const adminCodeEntered = typeof window !== 'undefined' && sessionStorage.getItem('admin_authenticated') === 'true';
  if (loading || (role !== 'admin' && !adminCodeEntered)) {
    return null;
  }

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
          <div className="flex space-x-2 items-center">
            <select
              value={adminRole}
              onChange={e => setAdminRole(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {DEMO_ROLES.map(role => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
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

        <Tabs defaultValue={tab} value={tab} className="space-y-4">
          <TabsList className="w-full overflow-x-auto flex flex-row gap-2 whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {canView.users && <TabsTrigger value="users">Users</TabsTrigger>}
            {canView.transactions && <TabsTrigger value="transactions">Transactions</TabsTrigger>}
            {canView.kyc && <TabsTrigger value="kyc">KYC</TabsTrigger>}
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="activity">User Activity</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            {canView.wallets && <TabsTrigger value="wallets">Wallets</TabsTrigger>}
            {canView.wallets && <TabsTrigger value="fund">Fund Wallet</TabsTrigger>}
            {canView.wallets && <TabsTrigger value="limits">Wallet Limits</TabsTrigger>}
            {canView.wallets && <TabsTrigger value="freeze">Freeze Wallet</TabsTrigger>}
            {canView.payouts && <TabsTrigger value="payouts">Payouts</TabsTrigger>}
            {canView.wallets && <TabsTrigger value="cards">Virtual Cards</TabsTrigger>}
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="giftcards">Gift Cards</TabsTrigger>
            {canView.config && <TabsTrigger value="config">Config</TabsTrigger>}
            {canView.system && <TabsTrigger value="system">System Tools</TabsTrigger>}
            {canView.staff && <TabsTrigger value="staff">Staff</TabsTrigger>}
            {canView.support && <TabsTrigger value="support">Support</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminAnalytics />
          </TabsContent>
          {canView.users && (
          <TabsContent value="users" className="space-y-4">
              <AdminUsersTab />
          </TabsContent>
          )}
          {canView.transactions && (
          <TabsContent value="transactions" className="space-y-4">
            <AdminTransactionsTab transactions={transactions} />
          </TabsContent>
          )}
          {canView.kyc && (
          <TabsContent value="kyc" className="space-y-4">
            <AdminKycTab kycApplications={kycApplications} onDataUpdate={fetchAdminData} />
          </TabsContent>
          )}
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
          {canView.wallets && (
            <>
              <TabsContent value="wallets" className="space-y-4">
                <AdminWalletsTab />
              </TabsContent>
              <TabsContent value="fund" className="space-y-4">
                <AdminWalletsTab mode="fund" />
              </TabsContent>
              <TabsContent value="limits" className="space-y-4">
                <AdminWalletsTab mode="limits" />
              </TabsContent>
              <TabsContent value="freeze" className="space-y-4">
                <AdminWalletsTab mode="freeze" />
              </TabsContent>
            </>
          )}
          {/* Comment out or remove undefined placeholders for now */}
          {/* <TabsContent value="payouts" className="space-y-4">
            <AdminPayouts />
          </TabsContent> */}
          {canView.wallets && (
            <TabsContent value="cards" className="space-y-4">
              <AdminWalletsTab mode="cards" />
            </TabsContent>
          )}
          <TabsContent value="bills" className="space-y-4">
            <AdminWalletsTab mode="bills" />
          </TabsContent>
          <TabsContent value="giftcards" className="space-y-4">
            <AdminWalletsTab mode="giftcards" />
          </TabsContent>
          {canView.config && (
            <TabsContent value="config" className="space-y-4">
              <AdminWalletsTab mode="config" />
            </TabsContent>
          )}
          {canView.system && (
            <TabsContent value="system" className="space-y-4">
              <AdminWalletsTab mode="system" />
            </TabsContent>
          )}
          {canView.staff && (
            <TabsContent value="staff" className="space-y-4">
              <AdminWalletsTab mode="staff" />
            </TabsContent>
          )}
          {canView.support && (
            <TabsContent value="support" className="space-y-4">
              <AdminWalletsTab mode="support" />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
