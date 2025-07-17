
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock
} from 'lucide-react';

const TransactionAnalytics = () => {
  const { transactions, loading, getTotalAmount, getTransactionsByStatus } = useTransactionHistory();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalIncoming = getTotalAmount('receive') + getTotalAmount('deposit');
  const totalOutgoing = getTotalAmount('send') + getTotalAmount('bill_payment');
  const completedTransactions = getTransactionsByStatus('completed');
  const pendingTransactions = getTransactionsByStatus('pending');

  const thisMonth = new Date().getMonth();
  const thisMonthTransactions = transactions.filter(
    tx => new Date(tx.created_at).getMonth() === thisMonth
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{totalIncoming.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time incoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₦{totalOutgoing.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time outgoing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {thisMonthTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Transaction Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Completed
              </Badge>
              <span className="text-sm text-gray-600">
                {completedTransactions.length} transactions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Pending
              </Badge>
              <span className="text-sm text-gray-600">
                {pendingTransactions.length} transactions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Failed
              </Badge>
              <span className="text-sm text-gray-600">
                {getTransactionsByStatus('failed').length} transactions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionAnalytics;
