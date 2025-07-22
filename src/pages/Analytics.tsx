
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, CreditCard, Users, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalsByCategory, setTotalsByCategory] = useState<Record<string, number>>({});
  const [totalsByMonth, setTotalsByMonth] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('transaction-analytics', {
          body: { user_id: user.id }
        });
        if (error || data?.error) {
          setError(error?.message || data?.error || 'Failed to fetch analytics');
          return;
        }
        setTotalsByCategory(data.totalsByCategory || {});
        setTotalsByMonth(data.totalsByMonth || {});
        setTransactions(data.transactions || []);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  // Map backend data to recharts format
  const monthlyData = Object.entries(totalsByMonth).map(([month, total]) => ({
    month,
    expenses: total,
  }));
  const expenseData = Object.entries(totalsByCategory).map(([name, value], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[i % COLORS.length],
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#00bfff', '#ff1493', '#a0522d', '#8a2be2', '#228b22'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Analytics</h1>
          <p className="text-gray-600">Track your spending patterns and financial health</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading analytics...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : (
        <>
        <div className="grid gap-6 mb-8">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{Object.values(totalsByCategory).reduce((a, b) => a + b, 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total of all categories</p>
              </CardContent>
            </Card>
            {/* You can add more summary cards here if you want */}
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                    <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                  </BarChart>
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
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
