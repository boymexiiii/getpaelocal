import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HandCoins, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RequestMoneyFormProps {
  onSuccess?: () => void;
}

const RequestMoneyForm: React.FC<RequestMoneyFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [fromEmail, setFromEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromEmail || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in the email and amount",
        variant: "destructive"
      });
      return;
    }

    const amountValue = parseFloat(amount);
    
    if (amountValue < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum request amount is ₦10",
        variant: "destructive"
      });
      return;
    }

    if (amountValue > 1000000) {
      toast({
        title: "Amount Too High",
        description: "Maximum request amount is ₦1,000,000",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request money",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('request-money', {
        body: {
          fromEmail,
          amount: amountValue,
          description: description || 'Money request',
          userId: user.id,
          requesterEmail: user.email,
          requesterName: user.user_metadata?.first_name || 'User'
        }
      });

      if (error) {
        // Try to show the actual error message from the response
        let errorMsg = error.message;
        if (errorMsg && errorMsg.startsWith('{')) {
          try {
            const parsed = JSON.parse(errorMsg);
            errorMsg = parsed.error || errorMsg;
          } catch {}
        }
        throw new Error(errorMsg || 'Failed to send money request');
      }

      toast({
        title: "Request Sent",
        description: `Money request for ₦${amountValue.toLocaleString()} has been sent to ${fromEmail}`,
      });

      // Reset form
      setFromEmail('');
      setAmount('');
      setDescription('');
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Request money error:', error);
      toast({
        title: "Request Failed",
        description: error.message || (error?.error ?? "Failed to send money request"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto sm:rounded-lg sm:shadow-md p-2 sm:p-4 md:p-6">
      <CardHeader className="px-2 py-4 sm:px-4 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
          <HandCoins className="w-5 h-5" />
          Request Money
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 py-4 sm:px-4 sm:py-6">
        <form onSubmit={handleRequest} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fromEmail">Request From (Email)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="fromEmail"
                type="email"
                placeholder="Enter email of person to request from"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
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
                max="1000000"
                step="10"
                required
              />
            </div>
            <p className="text-sm text-gray-500">
              Minimum: ₦10 • Maximum: ₦1,000,000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Reason for Request (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Why are you requesting this money?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-2 sm:mb-4">
            <h4 className="font-medium mb-2">Request Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span>Amount:</span>
                <span>₦{amount ? parseFloat(amount).toLocaleString() : '0.00'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span>From:</span>
                <span>{fromEmail || 'Enter email'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between font-medium border-t pt-2">
                <span>You will receive:</span>
                <span>₦{amount ? parseFloat(amount).toLocaleString() : '0.00'}</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending Request...
              </>
            ) : (
              <>
                <HandCoins className="w-4 h-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestMoneyForm;