
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Smartphone, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface SMSOTPVerificationProps {
  phoneNumber: string;
  onVerificationComplete: (verified: boolean) => void;
  onClose: () => void;
}

export const SMSOTPVerification = ({ 
  phoneNumber, 
  onVerificationComplete, 
  onClose 
}: SMSOTPVerificationProps) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(phoneNumber);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth ? useAuth() : { user: null };

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/functions/v1/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || phone, // fallback to phone if no user
          type: 'sms',
          purpose: 'phone_verification',
          userPhone: phone,
          expiry_minutes: 10
        })
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${phone}`,
        });
        setStep('otp');
        setResendTimer(60);
        // Start countdown timer
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast({
          title: "Failed to Send OTP",
          description: json.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Send OTP",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/functions/v1/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || phone,
          code: otp,
          purpose: 'phone_verification'
        })
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Verification Successful",
          description: "Your phone number has been verified",
        });
        onVerificationComplete(true);
      } else {
        toast({
          title: "Invalid OTP",
          description: json.error || "The code you entered is incorrect",
          variant: "destructive"
        });
        onVerificationComplete(false);
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Please try again",
        variant: "destructive"
      });
      onVerificationComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer === 0) {
      sendOTP();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-purple-100 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl flex items-center justify-center space-x-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <span>SMS Verification</span>
        </CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'Enter your phone number to receive a verification code'
            : 'Enter the 6-digit code sent to your phone'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="border-purple-200 focus:border-purple-500 pl-10"
                />
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={sendOTP}
                className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Code sent to {phone}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={verifyOTP}
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={resendTimer > 0}
                className="w-full"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setStep('phone')}
                className="w-full text-sm"
              >
                Change Phone Number
              </Button>
            </div>

            <div className="text-center">
              {/* No demo code message, now uses real backend */}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
