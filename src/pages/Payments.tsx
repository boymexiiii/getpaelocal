import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, QrCode, Send, ArrowLeft, Zap } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';

const Payments = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
          <p className="text-gray-600 max-w-2xl">Pay bills, send money, and make secure payments with ease. PaePros offers a variety of payment options to suit your needs, from instant transfers to QR code payments and bill settlements.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Options */}
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-600">Payment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    <Send className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Send Money</h3>
                      <p className="text-gray-600 text-sm">Transfer funds instantly to friends, family, or businesses.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/send')} className="mt-2">Send Now</Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <QrCode className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">QR Payments</h3>
                      <p className="text-gray-600 text-sm">Pay or receive money using QR codes for fast, contactless transactions.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/qr-payment')} className="mt-2">Scan QR</Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Pay Bills</h3>
                      <p className="text-gray-600 text-sm">Settle utility bills, buy airtime, and pay for services directly from your wallet.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/bills')} className="mt-2">Pay Bills</Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Zap className="w-8 h-8 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">Instant Top-Up</h3>
                      <p className="text-gray-600 text-sm">Top up your wallet instantly using various payment methods.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate('/fund')} className="mt-2">Top Up</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Use PaePros Payments?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                  <li>Instant and secure money transfers</li>
                  <li>Pay bills and utilities in seconds</li>
                  <li>Contactless QR code payments</li>
                  <li>Track all your payments in one place</li>
                  <li>24/7 support for all payment issues</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Payments; 