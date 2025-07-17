
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { verifyPaystackPayment } = usePaymentProviders();
  const { refetch } = useWallet();

  const status = searchParams.get('status');
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref'); // Flutterwave reference

  useEffect(() => {
    const verifyPayment = async () => {
      if (status === 'success' && (reference || trxref)) {
        try {
          // Verify Paystack payment
          if (reference) {
            const result = await verifyPaystackPayment(reference);
            if (result.success) {
              toast({
                title: "Payment Successful",
                description: "Your wallet has been funded successfully!",
              });
              refetch();
            } else {
              toast({
                title: "Payment Verification Failed",
                description: result.error || "Unable to verify payment",
                variant: "destructive",
              });
            }
          }
          
          // For Flutterwave, verification is handled by webhook
          if (trxref) {
            toast({
              title: "Payment Successful",
              description: "Your wallet funding is being processed!",
            });
            refetch();
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Verification Error",
            description: "Unable to verify payment. Please contact support if funds are not reflected.",
            variant: "destructive",
          });
        }
      }
    };

    verifyPayment();
  }, [status, reference, trxref, verifyPaystackPayment, toast, refetch]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isSuccess ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className={`text-2xl ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {isSuccess 
              ? 'Your wallet has been funded successfully. You can now use your balance for transactions.'
              : 'We were unable to process your payment. Please try again or contact support.'
            }
          </p>
          
          {reference && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Reference: {reference}</p>
            </div>
          )}
          
          {trxref && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Transaction ID: {trxref}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/fund')}
              className="flex-1"
            >
              Fund Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
