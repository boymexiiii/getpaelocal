import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import RequestMoneyForm from '@/components/RequestMoneyForm';
import { useWallet } from '@/hooks/useWallet';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useAuth } from '@/contexts/AuthContext';

const Request = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useWallet();
  const { transactions } = useTransactionHistory();

  const handleRequestSuccess = () => {
    refetch();
  };

  // Get recent transactions for this user
  const recentTransactions = transactions.slice(0, 5);

  // Calculate total sent and received
  const totalSent = transactions
    .filter(tx => ['send', 'bill_payment'].includes(tx.transaction_type) && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalReceived = transactions
    .filter(tx => ['receive', 'deposit'].includes(tx.transaction_type) && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Money</h1>
          <p className="text-gray-600">Ask someone to send you money</p>
        </div>

        <div className="grid gap-6">
          <RequestMoneyForm onSuccess={handleRequestSuccess} />

          {/* Transaction Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Received</p>
                    <p className="font-semibold text-green-600">
                      ₦{totalReceived.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Sent</p>
                    <p className="font-semibold text-red-600">
                      ₦{totalSent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="grid gap-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        ['receive', 'deposit'].includes(transaction.transaction_type) 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {['receive', 'deposit'].includes(transaction.transaction_type) ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">₦{transaction.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No recent transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Request;