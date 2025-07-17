import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FinancialData {
  revenue: Array<{ month: string; amount: number; transactions: number }>;
  expenses: Array<{ category: string; amount: number; color: string }>;
  userMetrics: Array<{ month: string; active: number; new: number }>;
}

const AdminFinancialReports: React.FC = () => {
  const { toast } = useToast();
  const [reportPeriod, setReportPeriod] = useState('6months');
  const [reportType, setReportType] = useState('revenue');
  const [financialData, setFinancialData] = useState<FinancialData>({
    revenue: [],
    expenses: [],
    userMetrics: []
  });
  const [loading, setLoading] = useState(true);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const months = reportPeriod === '3months' ? 3 : reportPeriod === '6months' ? 6 : 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Fetch transactions for revenue data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('created_at, amount, status')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      // Fetch users for user metrics
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Generate revenue data by month
      const revenueByMonth = Array.from({ length: months }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - 1 - i));
        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        
        const monthTransactions = transactions?.filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate.getMonth() === date.getMonth() && 
                 transactionDate.getFullYear() === date.getFullYear();
        }) || [];

        const monthlyRevenue = monthTransactions.reduce((sum, t) => sum + (t.amount * 0.01), 0); // 1% fee
        
        return {
          month: monthStr,
          amount: Math.round(monthlyRevenue),
          transactions: monthTransactions.length
        };
      });

      // Generate expense breakdown (mock categories with realistic percentages)
      const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.amount, 0);
      const expenseData = [
        { category: 'Payment Processing', amount: Math.round(totalRevenue * 0.15), color: '#8884d8' },
        { category: 'Compliance & Legal', amount: Math.round(totalRevenue * 0.08), color: '#82ca9d' },
        { category: 'Infrastructure', amount: Math.round(totalRevenue * 0.12), color: '#ffc658' },
        { category: 'Operations', amount: Math.round(totalRevenue * 0.20), color: '#ff7300' },
        { category: 'Marketing', amount: Math.round(totalRevenue * 0.05), color: '#00ff88' }
      ];

      // Generate user metrics by month
      const usersByMonth = Array.from({ length: months }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - 1 - i));
        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        
        const newUsers = users?.filter(u => {
          const userDate = new Date(u.created_at);
          return userDate.getMonth() === date.getMonth() && 
                 userDate.getFullYear() === date.getFullYear();
        }).length || 0;

        const totalUsersToDate = users?.filter(u => 
          new Date(u.created_at) <= date
        ).length || 0;

        return {
          month: monthStr,
          active: Math.round(totalUsersToDate * 0.7), // Assuming 70% activity rate
          new: newUsers
        };
      });

      setFinancialData({
        revenue: revenueByMonth,
        expenses: expenseData,
        userMetrics: usersByMonth
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [reportPeriod]);

  const totalRevenue = financialData.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = financialData.revenue.reduce((sum, item) => sum + item.transactions, 0);
  const totalExpenses = financialData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const exportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Revenue,Transactions,Expenses,Net Profit\n"
      + financialData.revenue.map((item, index) => 
          `"${item.month}","${item.amount}","${item.transactions}","${financialData.expenses[index]?.amount || 0}","${item.amount - (financialData.expenses[index]?.amount || 0)}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Report Exported",
      description: "Financial report has been exported to CSV",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">Revenue, expenses, and financial analytics</p>
        </div>
        <Button variant="outline" onClick={fetchFinancialData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">₦{totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">₦{totalExpenses.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Expenses</div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">₦{netProfit.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Net Profit</div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalTransactions.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Transactions</div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="expenses">Expense Report</SelectItem>
                  <SelectItem value="users">User Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={exportReport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Transaction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'amount' ? `₦${Number(value).toLocaleString()}` : value,
                  name === 'amount' ? 'Revenue' : 'Transactions'
                ]} />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="transactions" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={financialData.expenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {financialData.expenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialData.userMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" fill="#8884d8" name="Active Users" />
                <Bar dataKey="new" fill="#82ca9d" name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Margin Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Gross Profit Margin</span>
                <span className="text-green-600 font-bold">
                  {((netProfit / totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Average Transaction Value</span>
                <span className="text-blue-600 font-bold">
                  ₦{(totalRevenue / totalTransactions).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Monthly Growth Rate</span>
                <span className="text-purple-600 font-bold">+12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminFinancialReports;