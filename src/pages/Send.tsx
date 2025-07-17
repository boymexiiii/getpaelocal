
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import SendMoneyForm from '@/components/SendMoneyForm';
import { useWallet } from '@/hooks/useWallet';

const Send = () => {
  const navigate = useNavigate();
  const { refetch } = useWallet();

  const handleTransactionSuccess = () => {
    refetch(); // Refresh wallet balance after successful transaction
  };

  const recentContacts = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: 'JS' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Money</h1>
          <p className="text-gray-600">Transfer money to friends, family, or businesses</p>
        </div>

        <div className="grid gap-6">
          <SendMoneyForm onSuccess={handleTransactionSuccess} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Recent Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {recentContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-medium">{contact.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Send;
