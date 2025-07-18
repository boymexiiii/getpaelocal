import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const banks = [
  { code: '044', name: 'Access Bank' },
  { code: '011', name: 'First Bank' },
  { code: '058', name: 'GTBank' },
  // ...add more banks as needed
];

const countries = [
  { code: 'NG', name: 'Nigeria' },
  // ...add more countries if needed
];

export default function Remittance() {
  const [recipientName, setRecipientName] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [country, setCountry] = useState('NG');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/functions/remittance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName, bank, accountNumber, amount, country }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Success', description: 'Remittance initiated successfully!' });
      } else {
        toast({ title: 'Error', description: data.error || data.message || 'Remittance failed.' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Send Remittance</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Recipient Name"
          value={recipientName}
          onChange={e => setRecipientName(e.target.value)}
          required
        />
        <Select value={bank} onValueChange={setBank} required>
          <option value="">Select Bank</option>
          {banks.map(b => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </Select>
        <Input
          placeholder="Account Number"
          value={accountNumber}
          onChange={e => setAccountNumber(e.target.value)}
          required
        />
        <Input
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
        <Select value={country} onValueChange={setCountry} required>
          {countries.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </Select>
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Send'}
        </Button>
      </form>
    </div>
  );
} 