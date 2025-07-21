import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Send, 
  CreditCard, 
  TrendingUp, 
  Bell,
  Shield,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  QrCode
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import TransactionList from "@/components/TransactionList";
import KYCStatusCard from "@/components/KYCStatusCard";
import KYCStatusBanner from '@/components/KYCStatusBanner';

import Layout from "@/components/Layout";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallets, loading: walletLoading } = useWallet();
  const { transactions, loading: transactionsLoading } = useTransactionHistory();
  const [showBalance, setShowBalance] = useState(true);

  // Get the primary wallet (NGN wallet)
  const primaryWallet = wallets.find(w => w.currency === 'NGN') || wallets[0];

  const recentTransactions = transactions.slice(0, 5);
  const totalSent = transactions
    .filter(tx => ['send', 'bill_payment'].includes(tx.transaction_type) && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = transactions
    .filter(tx => ['receive', 'deposit'].includes(tx.transaction_type) && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-purple-50 via-white to-teal-50 min-h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* KYC Status Banner */}
          <KYCStatusBanner />
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.first_name || 'User'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your money today.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                onClick={() => navigate('/fund')}
                className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Money
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/send')}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Money
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/request')}
              >
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Request Money
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balance Card */}
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-600">Total Balance</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <CardDescription className="text-3xl font-bold text-gray-900">
                          {walletLoading ? (
                            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                          ) : showBalance ? (
                            formatCurrency(primaryWallet?.balance || 0)
                          ) : (
                            '••••••••'
                          )}
                        </CardDescription>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBalance(!showBalance)}
                        >
                          {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Received</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(totalReceived)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600">Sent</p>
                        <p className="font-semibold text-red-600">
                          {formatCurrency(totalSent)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/send')}
                    >
                      <Send className="w-6 h-6 text-purple-600" />
                      <span>Send Money</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/qr-payment')}
                    >
                      <QrCode className="w-6 h-6 text-purple-600" />
                      <span>QR Payment</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/fund')}
                    >
                      <Plus className="w-6 h-6 text-green-600" />
                      <span>Add Money</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/bills')}
                    >
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <span>Pay Bills</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/invest')}
                    >
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                      <span>Invest</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Your latest activity</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/transactions')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  ) : recentTransactions.length > 0 ? (
                    <TransactionList transactions={recentTransactions} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Start by adding money to your wallet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* KYC Status */}
              <KYCStatusCard />


              {/* Account Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Transactions</span>
                    <Badge variant="secondary">{transactions.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Status</span>
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm font-medium">
                      {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
