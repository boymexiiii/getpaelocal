
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Phone, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import { useNigeriaBanking } from '@/hooks/useNigeriaBanking';
import { useToast } from '@/hooks/use-toast';

const NigeriaBankTransfer = () => {
  const { nigerianBanks, initiateDirectTransfer, createTransferRecipient, getUSSDCode, verifyAccountNumber, loading } = useNigeriaBanking();
  const { toast } = useToast();
  
  const [transferData, setTransferData] = useState({
    bank_code: '',
    account_number: '',
    account_name: '',
    amount: '',
    narration: ''
  });
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('direct');

  const handleVerifyAccount = async () => {
    if (!transferData.bank_code || !transferData.account_number) {
      toast({
        title: "Incomplete Information",
        description: "Abeg select bank and enter account number",
        variant: "destructive"
      });
      return;
    }

    const result = await verifyAccountNumber(transferData.bank_code, transferData.account_number);
    if (result.success) {
      setVerifiedAccount(result.data);
      setTransferData(prev => ({
        ...prev,
        account_name: result.data.account_name
      }));
      toast({
        title: "Account Verified",
        description: `Account belongs to ${result.data?.account_name || 'Unknown'}`,
      });
    }
  };

  const handleDirectTransfer = async () => {
    if (!verifiedAccount || !transferData.amount) {
      toast({
        title: "Missing Information",
        description: "Please verify account and enter amount",
        variant: "destructive"
      });
      return;
    }

    const amountValue = parseFloat(transferData.amount);
    if (amountValue < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum bank transfer amount is ₦10",
        variant: "destructive"
      });
      return;
    }

    const result = await initiateDirectTransfer({
      bank_code: transferData.bank_code,
      account_number: transferData.account_number,
      account_name: transferData.account_name,
      amount: parseFloat(transferData.amount),
      narration: transferData.narration || 'Pae transfer'
    });

    if (result.success) {
      // Reset form
      setTransferData({
        bank_code: '',
        account_number: '',
        account_name: '',
        amount: '',
        narration: ''
      });
      setVerifiedAccount(null);
    } else {
      // Show the actual error message from the Edge Function
      toast({
        title: "Transfer Failed",
        description: result.error || "Failed to send money",
        variant: "destructive"
      });
    }
  };

  const getUSSDInstructions = () => {
    if (!transferData.bank_code) return null;
    return getUSSDCode(transferData.bank_code, transferData.amount ? parseFloat(transferData.amount) : undefined);
  };

  const ussdData = getUSSDInstructions();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          <span>Send Money to Nigerian Bank</span>
        </CardTitle>
        <CardDescription>
          Transfer money directly to any Nigerian bank account or use USSD
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Direct Transfer</span>
            </TabsTrigger>
            <TabsTrigger value="ussd" className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>USSD Code</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Select Bank *</Label>
                <Select value={transferData.bank_code} onValueChange={(value) => 
                  setTransferData(prev => ({ ...prev, bank_code: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number *</Label>
                  <Input
                    id="account_number"
                    type="text"
                    placeholder="0123456789"
                    value={transferData.account_number}
                    onChange={(e) => setTransferData(prev => ({ ...prev, account_number: e.target.value }))}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Verify Account</Label>
                  <Button 
                    onClick={handleVerifyAccount}
                    disabled={loading || !transferData.bank_code || !transferData.account_number}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? 'Checking...' : 'Verify Account'}
                  </Button>
                </div>
              </div>

              {verifiedAccount && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Account Verified</p>
                      <p className="text-sm text-green-600">{verifiedAccount.account_name}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="5000"
                    value={transferData.amount}
                    onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                    min="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="narration">Description</Label>
                  <Input
                    id="narration"
                    placeholder="What's this for?"
                    value={transferData.narration}
                    onChange={(e) => setTransferData(prev => ({ ...prev, narration: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleDirectTransfer}
                disabled={loading || !verifiedAccount || !transferData.amount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Sending...' : `Send ₦${transferData.amount ? parseFloat(transferData.amount).toLocaleString() : '0'}`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ussd" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ussd_bank">Select Your Bank *</Label>
                <Select value={transferData.bank_code} onValueChange={(value) => 
                  setTransferData(prev => ({ ...prev, bank_code: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank for USSD" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        <div className="flex items-center justify-between w-full">
                          <span>{bank.name}</span>
                          <Badge variant="secondary" className="ml-2">{bank.ussd}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ussd_amount">Amount (₦)</Label>
                <Input
                  id="ussd_amount"
                  type="number"
                  placeholder="5000"
                  value={transferData.amount}
                  onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              {ussdData && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-800">
                      <Smartphone className="w-5 h-5" />
                      <span>USSD Instructions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-4 bg-blue-100 rounded-lg">
                      <p className="text-2xl font-bold text-blue-800">{ussdData.ussd_code}</p>
                      <p className="text-sm text-blue-600">Dial this on your phone</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-blue-800">Follow these steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                        {ussdData.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                    {transferData.amount && (
                      <div className="p-2 bg-green-100 rounded border border-green-300">
                        <p className="text-sm text-green-700">
                          <strong>Amount to send:</strong> ₦{parseFloat(transferData.amount).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NigeriaBankTransfer;
