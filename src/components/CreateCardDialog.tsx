
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard } from "lucide-react";
import { useVirtualCards } from "@/hooks/useVirtualCards";
import { useWallet } from "@/hooks/useWallet";

export const CreateCardDialog = () => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [cardholderName, setCardholderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const { createCard } = useVirtualCards();
  const { wallets } = useWallet();

  const handleCreateCard = async () => {
    if (!amount || !cardholderName) {
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return;
    }

    // Check if user has sufficient balance
    const wallet = wallets.find(w => w.currency === 'NGN');
    const requiredAmount = currency === 'USD' ? amountNumber * 1500 : amountNumber; // Simple conversion rate
    
    if (!wallet || wallet.balance < requiredAmount) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await createCard({
        amount: amountNumber,
        currency,
        cardholderName
      });

      if (result.success) {
        setOpen(false);
        setAmount("");
        setCardholderName("");
        setCurrency("USD");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Virtual Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span>Create Virtual Card</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardholder">Cardholder Name</Label>
            <Input
              id="cardholder"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Enter cardholder name"
            />
          </div>
          
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Initial Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">
              {currency === 'USD' && amount && `≈ ₦${(parseFloat(amount) * 1500).toLocaleString()} will be deducted from your NGN wallet`}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCard}
              disabled={isCreating || !amount || !cardholderName}
              className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600"
            >
              {isCreating ? "Creating..." : "Create Card"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
