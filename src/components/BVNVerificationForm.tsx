
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useBVNVerification } from '@/hooks/useBVNVerification';

interface BVNVerificationFormProps {
  onVerificationSuccess?: (data: any) => void;
  onVerificationError?: (error: string) => void;
}

const BVNVerificationForm = ({ onVerificationSuccess, onVerificationError }: BVNVerificationFormProps) => {
  const [bvn, setBvn] = useState('');
  const { verifyBVN, loading, verificationData, isVerified } = useBVNVerification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bvn.trim()) {
      onVerificationError?.('Please enter your BVN');
      return;
    }

    if (!/^\d{11}$/.test(bvn.trim())) {
      onVerificationError?.('BVN must be exactly 11 digits');
      return;
    }

    const result = await verifyBVN(bvn);
    
    if (result.success && result.verified) {
      // Auto-populate form fields from BVN verification data
      onVerificationSuccess?.(result.data);
    } else {
      onVerificationError?.(result.error || 'Verification failed');
    }
  };

  if (isVerified && verificationData) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>BVN Verified Successfully</span>
          </CardTitle>
          <CardDescription className="text-green-600">
            Your Bank Verification Number has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Full Name</Label>
              <p className="font-medium">{verificationData.first_name} {verificationData.last_name}</p>
            </div>
            <div>
              <Label className="text-gray-600">Date of Birth</Label>
              <p className="font-medium">{verificationData.date_of_birth}</p>
            </div>
            <div>
              <Label className="text-gray-600">Phone Number</Label>
              <p className="font-medium">{verificationData.phone}</p>
            </div>
            <div>
              <Label className="text-gray-600">Status</Label>
              <p className="font-medium text-green-600 capitalize">{verificationData.verification_status}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>BVN Verification</span>
        </CardTitle>
        <CardDescription>
          Enter your 11-digit Bank Verification Number to verify your identity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bvn">Bank Verification Number (BVN) *</Label>
            <Input
              id="bvn"
              type="text"
              placeholder="Enter your 11-digit BVN"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
              maxLength={11}
              className="border-purple-200 focus:border-purple-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Your BVN is used to verify your identity and is kept secure
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
            disabled={loading || bvn.length !== 11}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying BVN...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Verify BVN
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Why do we need your BVN?</p>
              <ul className="space-y-1 text-blue-600">
                <li>• Verify your identity as required by Nigerian financial regulations</li>
                <li>• Ensure account security and prevent fraud</li>
                <li>• Enable higher transaction limits after verification</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BVNVerificationForm;
