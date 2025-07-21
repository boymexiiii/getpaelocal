import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, Landmark, Smartphone, DollarSign } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Fund = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'flutterwave' | 'paystack' | 'bank'>('flutterwave');

  const handleFund = async () => {
    const amountValue = parseFloat(amount);
    
    if (!amount || amountValue < 10) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least ₦10",
        variant: "destructive"
      });
      return;
    }

    if (amountValue > 500000) {
      toast({
        title: "Amount Too High",
        description: "Maximum funding amount is ₦500,000",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to fund your wallet",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('flutterwave-initialize', {
        body: {
          amount: amountValue,
          email: user.email,
          userId: user.id,
          name: user.user_metadata?.first_name || 'User'
        }
      });

      if (error) throw error;

      if (data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initialize payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Pay with cards, bank transfer, or mobile money',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-orange-500 to-yellow-500'
    }
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fund Wallet</h1>
          <p className="text-gray-600">Add money to your Pae wallet securely</p>
        </div>

        <div className="space-y-6">
          {/* Amount Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Enter Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="10"
                    max="500000"
                    step="100"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum: ₦10 • Maximum: ₦500,000</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethod(method.id as any)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${method.color} text-white`}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedMethod === method.id
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            onClick={handleFund}
            disabled={loading || !amount}
            className="w-full h-12 text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              `Fund Wallet with ₦${amount ? parseFloat(amount).toLocaleString() : '0'}`
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Fund;