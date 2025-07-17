
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Smartphone, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  reference: string;
  created_at: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'send':
    case 'bill_payment':
      return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    case 'receive':
    case 'deposit':
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    case 'card_creation':
      return <CreditCard className="w-4 h-4 text-blue-500" />;
    default:
      return <Smartphone className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const TransactionList = ({ transactions, title = "Recent Transactions" }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getTransactionIcon(transaction.transaction_type)}
                <div>
                  <p className="font-medium text-sm">
                    {transaction.description || transaction.transaction_type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${
                    ['send', 'bill_payment', 'card_creation'].includes(transaction.transaction_type) 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {['send', 'bill_payment', 'card_creation'].includes(transaction.transaction_type) ? '-' : '+'}
                    ₦{transaction.amount.toLocaleString()}
                  </span>
                </div>
                <Badge variant="secondary" className={`text-xs ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
