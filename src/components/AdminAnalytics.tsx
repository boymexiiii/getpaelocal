
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  transactionTrend: Array<{ name: string; transactions: number; volume: number }>;
  userGrowth: Array<{ name: string; users: number }>;
  kycDistribution: Array<{ name: string; value: number; color: string }>;
}

const AdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    transactionTrend: [],
    userGrowth: [],
    kycDistribution: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch transaction analytics for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      // Fetch user growth data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at, kyc_level')
        .gte('created_at', sixMonthsAgo.toISOString());

      // Process transaction data by month
      const transactionsByMonth = transactions?.reduce((acc: any, transaction) => {
        const month = new Date(transaction.created_at).toLocaleDateString('en-US', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { transactions: 0, volume: 0 };
        }
        acc[month].transactions += 1;
        acc[month].volume += Number(transaction.amount);
        return acc;
      }, {}) || {};

      const transactionTrend = Object.entries(transactionsByMonth).map(([name, data]: [string, any]) => ({
        name,
        transactions: data.transactions,
        volume: data.volume
      }));

      // Process user growth data
      const usersByMonth = profiles?.reduce((acc: any, profile) => {
        const month = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {}) || {};

      const userGrowth = Object.entries(usersByMonth).map(([name, users]: [string, any]) => ({
        name,
        users
      }));

      // Process KYC distribution
      const kycLevels = profiles?.reduce((acc: any, profile) => {
        const level = `Level ${profile.kyc_level || 1}`;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {}) || {};

      const colors = ['#8884d8', '#82ca9d', '#ffc658'];
      const kycDistribution = Object.entries(kycLevels).map(([name, value]: [string, any], index) => ({
        name,
        value,
        color: colors[index] || '#8884d8'
      }));

      setAnalyticsData({
        transactionTrend,
        userGrowth,
        kycDistribution
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className={i === 0 ? "lg:col-span-2" : ""}>
            <CardContent className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Transaction Volume Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.transactionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'volume' ? `₦${Number(value).toLocaleString()}` : value,
                name === 'volume' ? 'Volume' : 'Transactions'
              ]} />
              <Line type="monotone" dataKey="transactions" stroke="#8884d8" />
              <Line type="monotone" dataKey="volume" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KYC Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.kycDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.kycDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
