import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Wallet {
  id: string;
  user_id: string;
  balance: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

const WalletsAdminPage = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [editBalance, setEditBalance] = useState('');

  const fetchWallets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setWallets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallets();
    // eslint-disable-next-line
  }, []);

  const filteredWallets = wallets.filter(w =>
    w.user_id.toLowerCase().includes(search.toLowerCase()) ||
    w.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setEditBalance(wallet.balance?.toString() || '');
  };

  const handleSave = async () => {
    if (!selectedWallet) return;
    const { error } = await supabase
      .from('wallets')
      .update({ balance: Number(editBalance) })
      .eq('id', selectedWallet.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Wallet updated.' });
      fetchWallets();
      setSelectedWallet(null);
    }
  };

  const handleDelete = async (wallet: Wallet) => {
    if (!window.confirm('Are you sure you want to delete this wallet?')) return;
    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', wallet.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Wallet deleted.' });
      fetchWallets();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallets Management</CardTitle>
        <Input
          placeholder="Search by Wallet ID or User ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mt-2 max-w-xs"
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWallets.map(wallet => (
                <TableRow key={wallet.id}>
                  <TableCell>{wallet.id}</TableCell>
                  <TableCell>{wallet.user_id}</TableCell>
                  <TableCell>
                    {selectedWallet?.id === wallet.id ? (
                      <Input
                        value={editBalance}
                        onChange={e => setEditBalance(e.target.value)}
                        type="number"
                        className="w-24"
                      />
                    ) : (
                      wallet.balance ?? '-'
                    )}
                  </TableCell>
                  <TableCell>{wallet.currency ?? '-'}</TableCell>
                  <TableCell>{new Date(wallet.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {selectedWallet?.id === wallet.id ? (
                      <>
                        <Button size="sm" onClick={handleSave}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedWallet(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(wallet)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(wallet)}>Delete</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletsAdminPage; 