
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, DollarSign, BarChart3, PieChart, ArrowLeft, Bitcoin, Coins, Banknote } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useInvestments } from '@/hooks/useInvestments';
import { useToast } from '@/hooks/use-toast';

const Invest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { investments, loading, buyAsset, getTotalValue } = useInvestments();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investLoading, setInvestLoading] = useState(false);

  const handleInvest = async () => {
    if (!selectedAsset || !investmentAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter an amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (amount < 1000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum investment amount is ₦1,000",
        variant: "destructive"
      });
      return;
    }

    setInvestLoading(true);
    try {
      const result = await buyAsset(selectedAsset, amount);
      
      if (result.error) {
        toast({
          title: "Investment Failed",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Investment Successful!",
          description: `Successfully invested ₦${amount.toLocaleString()} in ${selectedAsset}`,
        });
        setInvestmentAmount('');
        setSelectedAsset(null);
      }
    } catch (error: any) {
      toast({
        title: "Investment Failed",
        description: error.message || "Failed to process investment",
        variant: "destructive"
      });
    } finally {
      setInvestLoading(false);
    }
  };

  const cryptoAssets = [
    {
      id: 'BTC',
      name: 'Bitcoin',
      symbol: 'BTC',
      description: 'The world\'s first and largest cryptocurrency',
      icon: <Bitcoin className="w-6 h-6" />,
      color: 'from-orange-500 to-yellow-500',
      price: '₦45,000,000',
      change: '+2.4%'
    },
    {
      id: 'ETH',
      name: 'Ethereum',
      symbol: 'ETH',
      description: 'Smart contracts and decentralized applications',
      icon: <Coins className="w-6 h-6" />,
      color: 'from-blue-500 to-purple-500',
      price: '₦3,000,000',
      change: '+5.1%'
    },
    {
      id: 'USDT',
      name: 'Tether',
      symbol: 'USDT',
      description: 'USD-pegged stablecoin for stability',
      icon: <Banknote className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      price: '₦1,000',
      change: '0.0%'
    }
  ];

  const totalValue = getTotalValue();
  const totalInvestments = investments.length;
  const monthlyReturns = totalValue * 0.02; // Estimated 2% monthly return

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crypto Investments</h1>
          <p className="text-gray-600">Invest in cryptocurrency and grow your portfolio</p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid gap-6 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {totalValue > 0 ? 'Your crypto portfolio' : 'Start investing today'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Returns</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{monthlyReturns.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Estimated monthly income</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvestments}</div>
                <p className="text-xs text-muted-foreground">Investment positions</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Crypto Assets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Cryptocurrencies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cryptoAssets.map((asset) => (
              <div key={asset.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${asset.color} text-white`}>
                      {asset.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{asset.name} ({asset.symbol})</h3>
                      <p className="text-gray-600 mb-2">{asset.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Price: {asset.price}</span>
                        <span className={`font-medium ${
                          asset.change.startsWith('+') ? 'text-green-600' : 
                          asset.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          24h: {asset.change}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedAsset(asset.id)}>
                        <PieChart className="w-4 h-4 mr-2" />
                        Invest Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invest in {asset.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Investment Amount (NGN)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                            min="1000"
                            step="100"
                          />
                          <p className="text-sm text-gray-500 mt-1">Minimum investment: ₦1,000</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Investment Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Asset:</span>
                              <span>{asset.name} ({asset.symbol})</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Amount:</span>
                              <span>₦{investmentAmount ? parseFloat(investmentAmount).toLocaleString() : '0'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Current Price:</span>
                              <span>{asset.price}</span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={handleInvest} 
                          disabled={investLoading || !investmentAmount}
                          className="w-full"
                        >
                          {investLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Processing Investment...
                            </>
                          ) : (
                            `Invest ₦${investmentAmount ? parseFloat(investmentAmount).toLocaleString() : '0'}`
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Investments */}
        {investments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investments.map((investment) => (
                  <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{investment.asset_type}</h4>
                      <p className="text-sm text-gray-600">
                        {investment.amount.toFixed(6)} {investment.asset_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bought on {new Date(investment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{investment.current_value?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        Purchase: ₦{investment.purchase_price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Invest;
