
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import TransactionList from '@/components/TransactionList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import Layout from '@/components/Layout';

const Transactions = () => {
  const { transactions, loading, getTransactionsByType, getTransactionsByStatus } = useTransactionHistory();

  const completedTransactions = getTransactionsByStatus('completed');
  const pendingTransactions = getTransactionsByStatus('pending');
  const sentTransactions = getTransactionsByType('send');
  const receivedTransactions = getTransactionsByType('receive');

  const stats = [
    {
      title: 'Total Transactions',
      value: transactions.length,
      icon: Receipt,
      color: 'text-blue-600'
    },
    {
      title: 'Money Sent',
      value: `₦${sentTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-red-600'
    },
    {
      title: 'Money Received',
      value: `₦${receivedTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}`,
      icon: TrendingDown,
      color: 'text-green-600'
    },
    {
      title: 'Pending',
      value: pendingTransactions.length,
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
          <p className="text-gray-600">View and manage all your transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transaction Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <TransactionList transactions={transactions} />
              </TabsContent>
              
              <TabsContent value="completed" className="mt-6">
                <TransactionList transactions={completedTransactions} />
              </TabsContent>
              
              <TabsContent value="pending" className="mt-6">
                <TransactionList transactions={pendingTransactions} />
              </TabsContent>
              
              <TabsContent value="sent" className="mt-6">
                <TransactionList transactions={sentTransactions} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Transactions;
