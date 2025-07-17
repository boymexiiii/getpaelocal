
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, User, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import { useWallet } from '@/hooks/useWallet';
import { useTransactionLimits } from '@/hooks/useTransactionLimits';
import { useToast } from '@/hooks/use-toast';

const QRPaymentConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sendMoney, wallets } = useWallet();
  const { checkTransactionLimit } = useTransactionLimits();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const paymentData = location.state?.paymentData;
  const primaryWallet = wallets.find(w => w.currency === 'NGN') || wallets[0];

  if (!paymentData) {
    navigate('/qr-payment');
    return null;
  }

  const handleConfirmPayment = async () => {
    setProcessing(true);

    try {
      // Check transaction limits
      const canProceed = await checkTransactionLimit(paymentData.amount, 'send');
      if (!canProceed) {
        setProcessing(false);
        return;
      }

      // Check sufficient balance
      if (!primaryWallet || primaryWallet.balance < paymentData.amount) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough money to complete this payment",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }

      // Process payment
      const result = await sendMoney(
        paymentData.email,
        paymentData.amount,
        `QR Payment: ${paymentData.description}`
      );

      if (result.error) {
        toast({
          title: "Payment Failed",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Payment Successful",
          description: `₦${paymentData.amount.toLocaleString()} sent successfully`,
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Payment</h1>
          <p className="text-gray-600">Review the payment details before sending</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Recipient</p>
                  <p className="font-medium">{paymentData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-2xl text-green-600">
                    ₦{paymentData.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{paymentData.description}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Request created: {new Date(paymentData.timestamp).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Amount</span>
                <span>₦{paymentData.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Fee</span>
                <span>₦0.00</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>₦{paymentData.amount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span>Available Balance</span>
                <span className="text-xl font-semibold">
                  ₦{primaryWallet?.balance?.toLocaleString() || '0.00'}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                After payment: ₦{((primaryWallet?.balance || 0) - paymentData.amount).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={processing || !primaryWallet || primaryWallet.balance < paymentData.amount}
              className="flex-1"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QRPaymentConfirm;
