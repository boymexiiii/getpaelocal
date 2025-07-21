import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAdminData } from '@/hooks/useAdminData';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const AnalyticsAdminPage: React.FC = () => {
  const { stats, transactions, loading } = useAdminData();

  // Monthly data aggregation for Bar/Line charts
  const monthlyMap = new Map<string, { income: number; expenses: number; volume: number }>();
  transactions.forEach(tx => {
    const date = new Date(tx.created_at);
    const month = date.toLocaleDateString('en', { month: 'short', year: '2-digit' });
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { income: 0, expenses: 0, volume: 0 });
    }
    const entry = monthlyMap.get(month)!;
    if (tx.transaction_type === 'receive' || tx.transaction_type === 'fund') {
      entry.income += tx.amount;
    } else {
      entry.expenses += tx.amount;
    }
    if (tx.status === 'completed') {
      entry.volume += tx.amount;
    }
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data }));

  // Pie chart for transaction type breakdown
  const typeMap = new Map<string, number>();
  transactions.forEach(tx => {
    typeMap.set(tx.transaction_type, (typeMap.get(tx.transaction_type) || 0) + tx.amount);
  });
  const typeData = Array.from(typeMap.entries()).map(([type, value], i) => ({ name: type, value, color: COLORS[i % COLORS.length] }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">Loading analytics...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Advanced Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={v => `₦${v.toLocaleString()}`} />
                  <Bar dataKey="income" fill="#8884d8" name="Income" />
                  <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={v => `₦${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="volume" stroke="#ffc658" strokeWidth={2} name="Volume" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `₦${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{stats.activeUsers}</div>
              <div className="text-xs text-gray-400">Active in last 7 days</div>
            </CardContent>
          </Card>
        </div>
        <div className="text-xs text-gray-400 mt-4">Analytics powered by real admin data and Recharts.</div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsAdminPage; 