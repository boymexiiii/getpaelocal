import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Eye, EyeOff, Settings, Pause, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useVirtualCards } from '@/hooks/useVirtualCards';
import { useStroWallet } from '@/hooks/useStroWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Cards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [cardData, setCardData] = useState({
    nameOnCard: '',
    amount: '',
    email: ''
  });
  
  const { cards, loading: cardsLoading, freezeCard, unfreezeCard } = useVirtualCards();
  const { createVirtualCard, loading: stroLoading } = useStroWallet();

  const handleCreateCard = async () => {
    if (!cardData.nameOnCard || !cardData.amount) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const result = await createVirtualCard({
      nameOnCard: cardData.nameOnCard,
      amount: parseFloat(cardData.amount),
      customerEmail: cardData.email || user?.email || '',
      publicKey: 'VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG',
      mode: 'sandbox'
    });

    if (result?.success) {
      setIsCreateDialogOpen(false);
      setCardData({ nameOnCard: '', amount: '', email: '' });
    }
  };

  const handleToggleFreeze = async (cardId: string, currentStatus: string) => {
    const success = currentStatus === 'frozen' 
      ? await unfreezeCard(cardId)
      : await freezeCard(cardId);
    
    if (success) {
      toast({
        title: "Success",
        description: `Card ${currentStatus === 'frozen' ? 'unfrozen' : 'frozen'} successfully`,
      });
    }
  };

  const maskCardNumber = (cardNumber: string) => {
    if (showCardNumbers) return cardNumber;
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'frozen': return 'bg-orange-100 text-orange-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual Cards</h1>
              <p className="text-gray-600">Manage your virtual cards for secure online payments</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowCardNumbers(!showCardNumbers)}
              >
                {showCardNumbers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showCardNumbers ? 'Hide' : 'Show'} Numbers
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create StroWallet Virtual Card</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nameOnCard">Cardholder Name</Label>
                      <Input
                        id="nameOnCard"
                        value={cardData.nameOnCard}
                        onChange={(e) => setCardData(prev => ({ ...prev, nameOnCard: e.target.value }))}
                        placeholder="Enter cardholder name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Prefund Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={cardData.amount}
                        onChange={(e) => setCardData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Enter amount (min $5)"
                        min="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={cardData.email}
                        onChange={(e) => setCardData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={user?.email || "Enter email"}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateCard} 
                        disabled={stroLoading}
                        className="flex-1"
                      >
                        {stroLoading ? 'Creating...' : 'Create Card'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            {cardsLoading ? (
              <div className="col-span-2 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading cards...</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Virtual Cards</h3>
                <p className="text-gray-500">Create your first virtual card to get started</p>
              </div>
            ) : (
              cards.map((card) => (
                <Card key={card.id} className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-teal-600 opacity-10" />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        {card.cardholder_name}
                      </CardTitle>
                      <Badge className={getStatusColor(card.status)}>
                        {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-600 to-teal-600 text-white p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm opacity-80">Balance</p>
                          <p className="text-2xl font-bold">${card.balance.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-80">{card.currency}</p>
                          <p className="text-sm opacity-80">Virtual Card</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-mono tracking-wider">
                          {maskCardNumber(card.card_number)}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm opacity-80">Expires: {card.expiry_month}/{card.expiry_year}</span>
                          <div className="flex gap-1">
                            <div className="w-8 h-5 bg-white rounded opacity-80" />
                            <div className="w-8 h-5 bg-white rounded opacity-60" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleFreeze(card.id, card.status)}
                        className={`flex-1 ${card.status === 'frozen' ? 'text-green-600' : 'text-orange-600'}`}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        {card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Card Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Instant Creation</h3>
                  <p className="text-sm text-gray-600">Create virtual cards instantly for online payments</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-medium mb-2">Full Control</h3>
                  <p className="text-sm text-gray-600">Set spending limits and freeze cards anytime</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Pause className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">Enhanced Security</h3>
                  <p className="text-sm text-gray-600">Secure online transactions with virtual cards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Cards;
