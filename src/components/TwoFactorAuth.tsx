import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Smartphone, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface TwoFactorAuthProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  purpose: string;
}

export const TwoFactorAuth = ({ isOpen, onOpenChange, onSuccess, purpose }: TwoFactorAuthProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendOTPEmail, sendOTPSMS } = useNotifications();
  const [step, setStep] = useState<'method' | 'verify'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [loading, setLoading] = useState(false);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTP = async () => {
    if (!user) return;

    setLoading(true);
    const otp = generateOTP();
    setGeneratedOTP(otp);

    try {
      const notificationData = {
        userId: user.id,
        userName: user.user_metadata?.first_name || 'User',
        userEmail: user.email || '',
        userPhone: user.user_metadata?.phone,
        otpCode: otp,
        purpose,
        expiryMinutes: 10
      };

      let success = false;

      if (selectedMethod === 'email') {
        success = await sendOTPEmail(notificationData);
      } else if (selectedMethod === 'sms' && notificationData.userPhone) {
        success = await sendOTPSMS(notificationData);
      }

      if (success) {
        setStep('verify');
        toast({
          title: "OTP Sent",
          description: `Verification code sent to your ${selectedMethod}`,
        });
      } else {
        throw new Error('Failed to send OTP');
      }

    } catch (error) {
      toast({
        title: "Failed to Send OTP",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = () => {
    if (otpCode === generatedOTP) {
      toast({
        title: "Verification Successful",
        description: "2FA verification completed",
      });
      onSuccess();
      onOpenChange(false);
      resetState();
    } else {
      toast({
        title: "Invalid Code",
        description: "Please check your code and try again",
        variant: "destructive"
      });
    }
  };

  const resetState = () => {
    setStep('method');
    setOtpCode('');
    setGeneratedOTP('');
    setSelectedMethod('email');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {step === 'method' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select your preferred method to receive the verification code for {purpose}:
            </p>

            <div className="space-y-3">
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethod === 'email' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedMethod('email')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedMethod === 'email' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'email' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-500">Send code to {user?.email}</p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethod === 'sms' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedMethod('sms')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedMethod === 'sms' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'sms' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium">SMS</p>
                    <p className="text-sm text-gray-500">
                      {user?.user_metadata?.phone ? 
                        `Send code to ${user.user_metadata.phone}` : 
                        'No phone number on file'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={sendOTP} 
              disabled={loading || (selectedMethod === 'sms' && !user?.user_metadata?.phone)}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to your {selectedMethod}
              </p>
            </div>

            <div>
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('method')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={verifyOTP}
                disabled={otpCode.length !== 6}
                className="flex-1"
              >
                Verify
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={sendOTP}
                disabled={loading}
              >
                Resend Code
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};