import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Wifi, Smartphone, Tv, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Bills = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayBill = async () => {
    if (!selectedBill || !amount || !accountNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to pay bills",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(amount) < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum bill payment amount is ₦10",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const billData = bills.find(b => b.id === selectedBill);
      
      const { data, error } = await supabase.functions.invoke('bill-payment', {
        body: {
          billType: billData?.category,
          provider: billData?.name,
          amount: parseFloat(amount),
          accountNumber,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Successful!",
          description: `₦${parseFloat(amount).toLocaleString()} payment to ${billData?.name} completed`,
        });
        
        // Reset form
        setAmount('');
        setAccountNumber('');
        setSelectedBill(null);
      } else {
        throw new Error(data.error || 'Payment failed');
      }

    } catch (error: any) {
      console.error('Bill payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process bill payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const bills = [
    {
      id: 'mtn-airtime',
      name: 'MTN Airtime',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      category: 'airtime'
    },
    {
      id: 'glo-airtime',
      name: 'Glo Airtime',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      category: 'airtime'
    },
    {
      id: 'airtel-airtime',
      name: 'Airtel Airtime',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'from-red-500 to-pink-500',
      category: 'airtime'
    },
    {
      id: 'mtn-data',
      name: 'MTN Data',
      icon: <Wifi className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      category: 'data'
    },
    {
      id: 'ikeja-electric',
      name: 'Ikeja Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      category: 'electricity'
    },
    {
      id: 'eko-electric',
      name: 'Eko Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      category: 'electricity'
    },
    {
      id: 'phed-electric',
      name: 'Port Harcourt Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500',
      category: 'electricity'
    },
    {
      id: 'eedc-electric',
      name: 'Enugu Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-emerald-500 to-green-500',
      category: 'electricity'
    },
    {
      id: 'ibedc-electric',
      name: 'Ibadan Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-amber-500 to-yellow-500',
      category: 'electricity'
    },
    {
      id: 'jos-electric',
      name: 'Jos Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-rose-500 to-pink-500',
      category: 'electricity'
    },
    {
      id: 'kaduna-electric',
      name: 'Kaduna Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-500',
      category: 'electricity'
    },
    {
      id: 'yola-electric',
      name: 'Yola Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-sky-500 to-blue-500',
      category: 'electricity'
    },
    {
      id: 'benin-electric',
      name: 'Benin Electric',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-lime-500 to-green-500',
      category: 'electricity'
    },
    {
      id: 'dstv',
      name: 'DSTV',
      icon: <Tv className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      category: 'cable'
    },
    {
      id: 'gotv',
      name: 'GOtv',
      icon: <Tv className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      category: 'cable'
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill Payments</h1>
          <p className="text-gray-600">Pay your bills quickly and securely</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bill Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedBill === bill.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBill(bill.id)}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-r ${bill.color} flex items-center justify-center text-white`}>
                        {bill.icon}
                      </div>
                      <h3 className="font-medium text-sm">{bill.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accountNumber">
                    {selectedBill?.includes('airtime') || selectedBill?.includes('data') 
                      ? 'Phone Number' 
                      : 'Account/Meter Number'}
                  </Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder={selectedBill?.includes('airtime') || selectedBill?.includes('data') 
                      ? '08012345678' 
                      : 'Enter account number'}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="10"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum: ₦10</p>
                </div>

                <Button
                  onClick={handlePayBill}
                  disabled={loading || !selectedBill || !amount || !accountNumber}
                  className="w-full h-12"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    `Pay ₦${amount ? parseFloat(amount).toLocaleString() : '0'}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Bills;