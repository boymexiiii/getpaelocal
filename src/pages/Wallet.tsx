import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Send, Plus, ArrowDownRight, QrCode, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import Layout from "@/components/Layout";

const WalletPage = () => {
  const navigate = useNavigate();
  const { wallets, loading: walletLoading } = useWallet();
  const [showBalance, setShowBalance] = useState(true);

  // Get the primary wallet (NGN wallet)
  const primaryWallet = wallets.find(w => w.currency === 'NGN') || wallets[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-purple-50 via-white to-teal-50 min-h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wallet</h1>
            <p className="text-gray-600 max-w-2xl">Manage your digital wallet: view your balance, add money, send funds, and pay bills securely. Your wallet is the heart of your PaePros experience, giving you instant access to your money and financial tools.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balance Card */}
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-600">Wallet Balance</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <CardDescription className="text-3xl font-bold text-gray-900">
                          {walletLoading ? (
                            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                          ) : showBalance ? (
                            formatCurrency(primaryWallet?.balance || 0)
                          ) : (
                            '••••••••'
                          )}
                        </CardDescription>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBalance(!showBalance)}
                        >
                          {showBalance ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <ArrowDownRight className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Add Money</p>
                        <Button size="sm" onClick={() => navigate('/fund')} className="bg-gradient-to-r from-purple-600 to-teal-600 text-white">Add</Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Send className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Send Money</p>
                        <Button size="sm" variant="outline" onClick={() => navigate('/send')}>Send</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Access your most used wallet features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/send')}
                    >
                      <Send className="w-6 h-6 text-purple-600" />
                      <span>Send Money</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/qr-payment')}
                    >
                      <QrCode className="w-6 h-6 text-purple-600" />
                      <span>QR Payment</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/fund')}
                    >
                      <Plus className="w-6 h-6 text-green-600" />
                      <span>Add Money</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => navigate('/bills')}
                    >
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <span>Pay Bills</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What is your Wallet?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">Your PaePros wallet is a secure digital account for storing, sending, and receiving money. Instantly fund your wallet, transfer to friends, pay bills, and more—all in one place.</p>
                  <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                    <li>Instant NGN deposits and withdrawals</li>
                    <li>Send and receive money 24/7</li>
                    <li>Pay bills and buy airtime/data</li>
                    <li>Track your transaction history</li>
                    <li>Bank-level security and privacy</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WalletPage; 