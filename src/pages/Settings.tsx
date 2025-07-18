
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, CreditCard, LogOut } from 'lucide-react';
import Layout from '@/components/Layout';

const Settings = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const settingsItems = [
    {
      icon: User,
      title: 'Profile',
      description: 'Manage your personal information',
      action: () => navigate('/profile')
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Password and security settings',
      action: () => navigate('/security')
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure your notification preferences',
      action: () => navigate('/notifications')
    },
    {
      icon: CreditCard,
      title: 'Accounting',
      description: 'View and export your wallet and transaction history',
      action: () => navigate('/settings/accounting')
    },
    {
      icon: CreditCard,
      title: 'Payment Methods',
      description: 'Manage your payment methods',
      action: () => navigate('/payment-methods')
    }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences</p>
        </div>

        <div className="grid gap-6">
          {settingsItems.map((item, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <item.icon className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600 font-normal">{item.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={item.action}>
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-700">
                <LogOut className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-semibold">Sign Out</h3>
                  <p className="text-sm text-gray-600 font-normal">Sign out of your account</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
