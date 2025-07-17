
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Scan, ArrowLeft, Share2 } from 'lucide-react';
import Layout from '@/components/Layout';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import QRCodeScanner from '@/components/QRCodeScanner';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const QRPayment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Generate QR state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // QR data for generation
  const qrData = JSON.stringify({
    type: 'payment_request',
    email: user?.email,
    amount: parseFloat(amount) || 0,
    description: description || 'Payment Request',
    timestamp: Date.now()
  });

  const handleScanResult = (result: string) => {
    try {
      const paymentData = JSON.parse(result);
      
      if (paymentData.type === 'payment_request') {
        // Navigate to confirmation page with payment data
        navigate('/qr-payment-confirm', { 
          state: { paymentData } 
        });
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not a valid payment request",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Unable to read QR code data",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Request',
          text: `Pay me ₦${amount} - ${description}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      toast({
        title: "QR Code Ready",
        description: "Screenshot the QR code to share it",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Payments</h1>
          <p className="text-gray-600">Send and receive money instantly with QR codes</p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Generate QR
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Scan className="w-4 h-4" />
              Scan QR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Payment Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (NGN)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What is this payment for?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    {[1000, 5000, 10000, 25000].map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(preset.toString())}
                      >
                        ₦{preset.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Your QR Code
                    {amount && (
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {amount && parseFloat(amount) > 0 ? (
                    <div className="space-y-4">
                      <QRCodeGenerator 
                        data={qrData} 
                        size={200}
                        level="M"
                      />
                      <div className="text-center">
                        <p className="font-semibold text-lg">₦{parseFloat(amount).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{description || 'Payment Request'}</p>
                        <p className="text-xs text-gray-400">Scan to pay {user?.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Enter an amount to generate QR code</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scan" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code to Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeScanner onScanResult={handleScanResult} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default QRPayment;
