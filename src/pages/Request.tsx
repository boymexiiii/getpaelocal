import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import RequestMoneyForm from '@/components/RequestMoneyForm';
import { useWallet } from '@/hooks/useWallet';

const Request = () => {
  const navigate = useNavigate();
  const { refetch } = useWallet();

  const handleRequestSuccess = () => {
    refetch();
  };

  const pendingRequests = [
    { id: 1, from: 'john@example.com', amount: 5000, description: 'Lunch money', date: '2 hours ago' },
    { id: 2, from: 'jane@example.com', amount: 15000, description: 'Project payment', date: '1 day ago' },
  ];

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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length > 0 ? (
                <div className="grid gap-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">₦{request.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">From {request.from}</p>
                        <p className="text-sm text-gray-500">{request.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{request.date}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            Decline
                          </Button>
                          <Button size="sm" className="text-xs">
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No pending requests</p>
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