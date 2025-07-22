import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PaymentsInfo = () => {
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
              <Zap className="w-7 h-7 text-purple-600" />
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
                Make fast, secure payments for bills, airtime, and more. PaePros lets you pay anyone, anywhere, anytime with just a few taps.
              </p>
              <ul className="list-disc pl-8 text-gray-600 text-base space-y-2">
                <li>Pay utility bills, buy airtime, and settle subscriptions</li>
                <li>Send money instantly to friends and family</li>
                <li>Contactless QR code payments</li>
                <li>Track all your payments in one place</li>
                <li>24/7 support for all payment issues</li>
              </ul>
              <div className="text-center mt-8">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-teal-600 px-8 py-4 text-lg" onClick={() => navigate('/register')}>
                  Start Paying
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentsInfo; 