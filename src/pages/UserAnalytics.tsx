import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Calendar
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useWallet } from '@/hooks/useWallet';

interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

const UserAnalytics = () => {
  const { transactions } = useTransactionHistory();
  const { wallets } = useWallet();
  const [timeframe, setTimeframe] = useState('30'); // days
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    transactionCount: 0,
    monthlyData: [],
    categoryBreakdown: []
  });

  useEffect(() => {
    calculateAnalytics();
  }, [transactions, timeframe]);

  const calculateAnalytics = () => {
    if (!transactions || transactions.length === 0) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    const filteredTransactions = transactions.filter(t => 
      new Date(t.created_at) >= cutoffDate
    );

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach(transaction => {
      if (transaction.transaction_type === 'receive' || transaction.transaction_type === 'fund') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }
    });

    // Monthly breakdown
    const monthlyMap = new Map();
    filteredTransactions.forEach(transaction => {
      const month = new Date(transaction.created_at).toLocaleDateString('en', { month: 'short' });
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { income: 0, expenses: 0 });
      }
      
      const data = monthlyMap.get(month);
      if (transaction.transaction_type === 'receive' || transaction.transaction_type === 'fund') {
        data.income += transaction.amount;
      } else {
        data.expenses += transaction.amount;
      }
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data
    }));

    // Category breakdown
    const categoryMap = new Map();
    filteredTransactions.forEach(transaction => {
      const category = transaction.transaction_type;
      categoryMap.set(category, (categoryMap.get(category) || 0) + transaction.amount);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / (totalIncome + totalExpenses)) * 100
    }));

    setAnalytics({
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length,
      monthlyData,
      categoryBreakdown
    });
  };

  const currentBalance = wallets.find(w => w.currency === 'NGN')?.balance || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
            <p className="text-gray-600">Insights into your spending and earning patterns</p>
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{currentBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Your wallet balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₦{analytics.totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Last {timeframe} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₦{analytics.totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Last {timeframe} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
              {analytics.netFlow >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                analytics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₦{Math.abs(analytics.netFlow).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.netFlow >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Breakdown */}
        <Tabs defaultValue="spending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
            <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Income vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Income</span>
                      <span className="font-medium text-green-600">
                        ₦{analytics.totalIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${analytics.totalIncome / (analytics.totalIncome + analytics.totalExpenses) * 100}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expenses</span>
                      <span className="font-medium text-red-600">
                        ₦{analytics.totalExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ 
                          width: `${analytics.totalExpenses / (analytics.totalIncome + analytics.totalExpenses) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Transaction Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Transactions</span>
                      <span className="font-medium">{analytics.transactionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average per Transaction</span>
                      <span className="font-medium">
                        ₦{analytics.transactionCount > 0 
                          ? Math.round((analytics.totalIncome + analytics.totalExpenses) / analytics.transactionCount).toLocaleString()
                          : '0'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Daily Average</span>
                      <span className="font-medium">
                        ₦{Math.round((analytics.totalIncome + analytics.totalExpenses) / parseInt(timeframe)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.monthlyData.map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{month.month}</span>
                        <span className={`text-sm ${
                          month.income - month.expenses >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₦{Math.abs(month.income - month.expenses).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-green-600">Income: ₦{month.income.toLocaleString()}</div>
                        <div className="text-red-600">Expenses: ₦{month.expenses.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryBreakdown.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category.category.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-600">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <span className="font-medium">₦{category.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserAnalytics;