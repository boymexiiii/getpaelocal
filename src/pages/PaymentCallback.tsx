
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { useSentry } from '@/hooks/useSentry';
import Layout from '@/components/Layout';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetch } = useWallet();
  const { logError, logTransaction } = useSentry();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const transactionId = searchParams.get('transaction_id');
      const txRef = searchParams.get('tx_ref');
      const paymentStatus = searchParams.get('status');

      if (!transactionId || !txRef) {
        setStatus('failed');
        logError(new Error('Missing payment parameters'), {
          transactionId,
          txRef,
          paymentStatus
        });
        return;
      }

      try {
        // Verify payment with Flutterwave
        const { data, error } = await supabase.functions.invoke('flutterwave-verify', {
          body: { transactionId }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.success) {
          setStatus('success');
          setTransactionData(data);
          
          // Log successful transaction
          logTransaction('flutterwave_funding', data.amount, 'success');
          
          // Refresh wallet data
          await refetch();
          
          toast({
            title: "Payment Successful!",
            description: `₦${data.amount.toLocaleString()} has been added to your wallet`,
          });
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (error) {
        setStatus('failed');
        logError(error as Error, { 
          step: 'payment_verification',
          transactionId,
          txRef 
        });
        
        logTransaction('flutterwave_funding', 0, 'failed');
        
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if you were charged",
          variant: "destructive"
        });
      }
    };

    verifyPayment();
  }, [searchParams, toast, refetch, logError, logTransaction]);

  const handleGoToWallet = () => {
    navigate('/dashboard');
  };

  const handleTryAgain = () => {
    navigate('/fund');
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {status === 'loading' && (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <CardTitle>Verifying Payment...</CardTitle>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-600">Payment Successful!</CardTitle>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Payment Failed</CardTitle>
              </>
            )}
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            {status === 'loading' && (
              <p className="text-gray-600">
                Please wait while we verify your payment with Flutterwave...
              </p>
            )}
            
            {status === 'success' && transactionData && (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Your wallet has been funded successfully!
                </p>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    ₦{transactionData.amount?.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">Added to your wallet</p>
                </div>
                <Button onClick={handleGoToWallet} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}
            
            {status === 'failed' && (
              <div className="space-y-3">
                <p className="text-gray-600">
                  We couldn't verify your payment. If you were charged, please contact our support team.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleTryAgain} variant="outline" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={handleGoToWallet} className="flex-1">
                    Go Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentCallback;
