import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CardsInfo = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
              <CreditCard className="w-7 h-7 text-purple-600" />
              Virtual Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
                Shop online securely with PaePros Virtual Cards. Instantly create, manage, and control your cards for all your online payments and subscriptions.
              </p>
              <ul className="list-disc pl-8 text-gray-600 text-base space-y-2">
                <li>Instant card creation for online shopping</li>
                <li>Set spending limits and freeze cards anytime</li>
                <li>Accepted worldwide wherever Visa/Mastercard is supported</li>
                <li>Enhanced security for your online transactions</li>
                <li>Track your card usage and manage subscriptions</li>
              </ul>
              <div className="text-center mt-8">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-teal-600 px-8 py-4 text-lg" onClick={() => navigate('/register')}>
                  Get Your Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardsInfo; 