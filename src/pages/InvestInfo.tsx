import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const InvestInfo = () => {
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
              <TrendingUp className="w-7 h-7 text-purple-600" />
              Crypto Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
                Grow your wealth by investing in cryptocurrencies like Bitcoin, Ethereum, and USDT. PaePros makes it easy and secure to diversify your portfolio and earn potential returns.
              </p>
              <ul className="list-disc pl-8 text-gray-600 text-base space-y-2">
                <li>Buy, sell, and auto-invest in top cryptocurrencies</li>
                <li>Track your portfolio and returns in real time</li>
                <li>Secure storage and instant transactions</li>
                <li>Low fees and transparent pricing</li>
                <li>Educational resources for new investors</li>
              </ul>
              <div className="text-center mt-8">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-teal-600 px-8 py-4 text-lg" onClick={() => navigate('/register')}>
                  Start Investing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvestInfo; 