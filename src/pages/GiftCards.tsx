import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Gift, ArrowLeft, Smartphone, Tv, Music, GamepadIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface GiftCard {
  id: number;
  name: string;
  brand: string;
  country: string;
  denominations: number[];
  minPrice: number;
  maxPrice: number;
  logoUrl: string | null;
  description: string;
  currency: string;
}

const GiftCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Purchase form state
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-gift-cards');
      
      if (error) throw error;
      
      if (data.success) {
        setGiftCards(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error fetching gift cards:', error);
      toast({
        title: "Failed to load gift cards",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedCard || !selectedAmount || !recipientEmail || !recipientName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase gift cards",
        variant: "destructive"
      });
      return;
    }

    setPurchaseLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gift-cards', {
        body: {
          productId: selectedCard.id,
          unitPrice: parseFloat(selectedAmount),
          quantity: parseInt(quantity),
          senderName: user.user_metadata?.first_name || user.email || 'User',
          recipientEmail,
          recipientName,
          customMessage,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Gift Card Purchased!",
          description: `Successfully sent ${selectedCard.name} gift card to ${recipientEmail}`,
        });
        
        // Reset form
        setSelectedCard(null);
        setSelectedAmount('');
        setQuantity('1');
        setRecipientEmail('');
        setRecipientName('');
        setCustomMessage('');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Gift card purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase gift card",
        variant: "destructive"
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const getBrandIcon = (brandName: string) => {
    const brand = brandName.toLowerCase();
    if (brand.includes('netflix') || brand.includes('tv')) return <Tv className="w-6 h-6" />;
    if (brand.includes('music') || brand.includes('spotify')) return <Music className="w-6 h-6" />;
    if (brand.includes('xbox') || brand.includes('playstation') || brand.includes('game')) return <GamepadIcon className="w-6 h-6" />;
    if (brand.includes('phone') || brand.includes('mobile')) return <Smartphone className="w-6 h-6" />;
    return <Gift className="w-6 h-6" />;
  };

  const getBrandColor = (brandName: string) => {
    const brand = brandName.toLowerCase();
    if (brand.includes('netflix')) return 'from-red-500 to-red-600';
    if (brand.includes('amazon')) return 'from-orange-500 to-yellow-500';
    if (brand.includes('google')) return 'from-blue-500 to-green-500';
    if (brand.includes('apple') || brand.includes('itunes')) return 'from-gray-500 to-gray-600';
    if (brand.includes('spotify')) return 'from-green-500 to-green-600';
    if (brand.includes('xbox')) return 'from-green-600 to-green-700';
    if (brand.includes('playstation')) return 'from-blue-600 to-blue-700';
    return 'from-purple-500 to-pink-500';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gift Cards</h1>
          <p className="text-gray-600">Send digital gift cards to friends and family</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : giftCards.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giftCards.map((card) => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getBrandColor(card.brand)} text-white`}>
                      {getBrandIcon(card.brand)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <p className="text-sm text-gray-600">{card.brand}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">
                      ${card.minPrice} - ${card.maxPrice}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {card.country}
                    </span>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        onClick={() => setSelectedCard(card)}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Purchase Gift Card
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Purchase {card.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount ({card.currency})</Label>
                          {card.denominations.length > 0 ? (
                            <Select onValueChange={setSelectedAmount}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select amount" />
                              </SelectTrigger>
                              <SelectContent>
                                {card.denominations.map((amount) => (
                                  <SelectItem key={amount} value={amount.toString()}>
                                    {card.currency} {amount}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="amount"
                              type="number"
                              placeholder={`Min: ${card.minPrice}, Max: ${card.maxPrice}`}
                              value={selectedAmount}
                              onChange={(e) => setSelectedAmount(e.target.value)}
                              min={card.minPrice}
                              max={card.maxPrice}
                            />
                          )}
                        </div>

                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            max="10"
                          />
                        </div>

                        <div>
                          <Label htmlFor="recipientName">Recipient Name</Label>
                          <Input
                            id="recipientName"
                            type="text"
                            placeholder="Enter recipient's name"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="recipientEmail">Recipient Email</Label>
                          <Input
                            id="recipientEmail"
                            type="email"
                            placeholder="Enter recipient's email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="message">Custom Message (Optional)</Label>
                          <Textarea
                            id="message"
                            placeholder="Add a personal message..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Purchase Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Gift Card:</span>
                              <span>{card.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Amount:</span>
                              <span>{card.currency} {selectedAmount || '0'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quantity:</span>
                              <span>{quantity}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-2">
                              <span>Total:</span>
                              <span>{card.currency} {selectedAmount && quantity ? (parseFloat(selectedAmount) * parseInt(quantity)).toFixed(2) : '0.00'}</span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={handlePurchase}
                          disabled={purchaseLoading}
                          className="w-full"
                        >
                          {purchaseLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Processing Purchase...
                            </>
                          ) : (
                            `Purchase Gift Card`
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Gift Cards Available</h3>
              <p className="text-gray-600">Please try again later or contact support.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GiftCards;