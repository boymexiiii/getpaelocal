import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || type !== 'signup') {
        setVerificationStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          setVerificationStatus('error');
          setMessage(error.message);
          toast({
            title: "Verification Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setVerificationStatus('success');
          setMessage('Email verified successfully!');
          toast({
            title: "Email Verified",
            description: "Your email has been verified. You can now sign in.",
          });
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Email verification error:', err);
        setVerificationStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  const handleResendVerification = async () => {
    // This would typically require the user's email
    toast({
      title: "Resend Verification",
      description: "Please sign up again to receive a new verification email.",
    });
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationStatus === 'loading' && (
              <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
            {verificationStatus === 'error' && (
              <AlertCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {verificationStatus === 'loading' && 'Verifying your email...'}
            {verificationStatus === 'success' && 'Email verified successfully!'}
            {verificationStatus === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {verificationStatus === 'success' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Redirecting to login page in a few seconds...
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Continue to Login
              </Button>
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="space-y-2">
              <Button onClick={handleResendVerification} className="w-full">
                Sign Up Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;