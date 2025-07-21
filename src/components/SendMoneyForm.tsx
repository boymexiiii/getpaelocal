import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send as SendIcon, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletWithLimits } from '@/hooks/useWalletWithLimits';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SendMoneyFormProps {
  onSuccess?: () => void;
}

const SendMoneyForm: React.FC<SendMoneyFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { performTransactionWithLimitCheck, getAvailableLimit, canAfford } = useWalletWithLimits();
  
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientIdentifier || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in recipient email and amount",
        variant: "destructive"
      });
      return;
    }

    const amountValue = parseFloat(amount);
    
    if (amountValue < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum transfer amount is ₦10",
        variant: "destructive"
      });
      return;
    }

    if (!canAfford(amountValue)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds for this transfer",
        variant: "destructive"
      });
      return;
    }

    // Check if amount requires OTP (amounts over ₦50,000)
    if (amountValue > 50000 && !requiresOTP) {
      setRequiresOTP(true);
      toast({
        title: "OTP Required",
        description: "Large transfers require email verification. Check your email for OTP.",
        variant: "default"
      });
      // In a real app, you'd send OTP to user's email here
      return;
    }

    if (requiresOTP && !otpCode) {
      toast({
        title: "OTP Required",
        description: "Please enter the OTP sent to your email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const result = await performTransactionWithLimitCheck({
        amount: amountValue,
        type: 'send',
        description: description || 'Money transfer',
        recipientIdentifier
      });

      if (result.success) {
        toast({
          title: "Transfer Successful",
          description: `Successfully sent ₦${amountValue.toLocaleString()} to ${recipientIdentifier}`,
        });

        // Reset form
        setRecipientIdentifier('');
        setAmount('');
        setDescription('');
        setRequiresOTP(false);
        setOtpCode('');
        
        onSuccess?.();
      } else {
        toast({
          title: "Transfer Failed",
          description: result.error || "Failed to send money",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Send money error:', error);
      toast({
        title: "Transfer Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const availableLimit = getAvailableLimit('send');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SendIcon className="w-5 h-5" />
          Send Money
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient (Email or Username)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="recipientEmail"
                type="text"
                placeholder="Enter recipient's email or username"
                value={recipientIdentifier}
                onChange={e => setRecipientIdentifier(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (NGN)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                step="10"
                required
              />
            </div>
            <p className="text-sm text-gray-500">
              Available daily limit: ₦{availableLimit.toLocaleString()}
            </p>
          </div>

          {requiresOTP && (
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code from email"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                required
              />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Large transfers require email verification. Enter the code sent to your email.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note for this transfer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Transfer Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>₦{amount ? parseFloat(amount).toLocaleString() : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Fee:</span>
                <span>₦0.00</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total:</span>
                <span>₦{amount ? parseFloat(amount).toLocaleString() : '0.00'}</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <SendIcon className="w-4 h-4 mr-2" />
                Send Money
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SendMoneyForm;