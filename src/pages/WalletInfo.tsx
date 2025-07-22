import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const WalletInfo = () => {
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
              <Wallet className="w-7 h-7 text-purple-600" />
              Your Digital Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
                The PaePros Wallet is your secure digital account for storing, sending, and receiving money. Instantly fund your wallet, transfer to friends, pay bills, and more—all in one place.
              </p>
              <ul className="list-disc pl-8 text-gray-600 text-base space-y-2">
                <li>Instant NGN deposits and withdrawals</li>
                <li>Send and receive money 24/7</li>
                <li>Pay bills and buy airtime/data</li>
                <li>Track your transaction history</li>
                <li>Bank-level security and privacy</li>
              </ul>
              <div className="text-center mt-8">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-teal-600 px-8 py-4 text-lg" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletInfo; 