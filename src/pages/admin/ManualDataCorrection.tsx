import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const ManualDataCorrection: React.FC = () => {
  const { user: currentUser } = useAuth(); // Get current admin user
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState<any | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [editWallet, setEditWallet] = useState<any | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);
  const [rollbackTxId, setRollbackTxId] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    setSearchError(null);
    setUser(null);
    setWallets([]);
    try {
      // Fetch user by email or ID
      const userRes = await fetch(`/rest/v1/profiles?or=(id.eq.${userId},email.eq.${userId})`);
      const users = await userRes.json();
      if (!users.length) throw new Error('User not found');
      setUser(users[0]);
      // Fetch wallets
      const walletsRes = await fetch(`/rest/v1/wallets?user_id=eq.${users[0].id}`);
      setWallets(await walletsRes.json());
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const openEdit = (wallet: any) => {
    setEditWallet(wallet);
    setNewBalance(wallet.balance?.toString() || '');
    setReason('');
    setCorrectionError(null);
    setCorrectionSuccess(null);
    setConfirmOpen(true);
  };

  const handleApplyCorrection = async () => {
    setCorrectionLoading(true);
    setCorrectionError(null);
    setCorrectionSuccess(null);
    try {
      const res = await fetch('/functions/manual-data-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'balance',
          user_id: user.id,
          wallet_id: editWallet.id,
          new_balance: Number(newBalance),
          reason,
          admin_id: currentUser?.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCorrectionSuccess('Balance updated successfully.');
      setEditWallet(null);
      setConfirmOpen(false);
      // Refresh wallets
      const walletsRes = await fetch(`/rest/v1/wallets?user_id=eq.${user.id}`);
      setWallets(await walletsRes.json());
    } catch (e: any) {
      setCorrectionError(e.message);
    } finally {
      setCorrectionLoading(false);
    }
  };

  const openRollback = () => {
    setRollbackConfirmOpen(true);
    setCorrectionError(null);
    setCorrectionSuccess(null);
  };

  const handleRollback = async () => {
    setCorrectionLoading(true);
    setCorrectionError(null);
    setCorrectionSuccess(null);
    try {
      const res = await fetch('/functions/manual-data-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rollback',
          transaction_id: rollbackTxId,
          reason: rollbackReason,
          admin_id: currentUser?.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCorrectionSuccess('Transaction rolled back successfully.');
      setRollbackConfirmOpen(false);
      setRollbackTxId('');
      setRollbackReason('');
    } catch (e: any) {
      setCorrectionError(e.message);
    } finally {
      setCorrectionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Manual Data Correction</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search User</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <Input
              placeholder="User email or ID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleSearch} disabled={searching || !userId}>Search</Button>
            {searchError && <span className="text-red-500 ml-2">{searchError}</span>}
          </CardContent>
        </Card>
        {user && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Wallets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Wallet ID</th>
                      <th className="px-4 py-2 text-left">Currency</th>
                      <th className="px-4 py-2 text-left">Balance</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map(w => (
                      <tr key={w.id} className="border-t">
                        <td className="px-4 py-2">{w.id}</td>
                        <td className="px-4 py-2">{w.currency}</td>
                        <td className="px-4 py-2">₦{w.balance?.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(w)}>Edit Balance</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rollback Transaction</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <Input
              placeholder="Transaction ID"
              value={rollbackTxId}
              onChange={e => setRollbackTxId(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="Reason for rollback"
              value={rollbackReason}
              onChange={e => setRollbackReason(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={openRollback} disabled={!rollbackTxId || !rollbackReason}>Rollback</Button>
          </CardContent>
        </Card>
        {/* Edit Balance Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Balance Correction</DialogTitle>
              <DialogDescription>
                Are you sure you want to set the balance for wallet <b>{editWallet?.id}</b> to <b>₦{newBalance}</b>?<br />
                Please provide a reason for this correction. All changes are logged.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="number"
              placeholder="New balance"
              value={newBalance}
              onChange={e => setNewBalance(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="Reason for correction"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleApplyCorrection} disabled={!newBalance || !reason || correctionLoading}>
              {correctionLoading ? 'Applying...' : 'Apply Correction'}
            </Button>
            {correctionError && <div className="text-red-500 mt-2">{correctionError}</div>}
            {correctionSuccess && <div className="text-green-600 mt-2">{correctionSuccess}</div>}
          </DialogContent>
        </Dialog>
        {/* Rollback Confirmation Dialog */}
        <Dialog open={rollbackConfirmOpen} onOpenChange={setRollbackConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Transaction Rollback</DialogTitle>
              <DialogDescription>
                Are you sure you want to rollback transaction <b>{rollbackTxId}</b>?<br />
                Please provide a reason. All changes are logged.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleRollback} disabled={correctionLoading}>
              {correctionLoading ? 'Rolling back...' : 'Confirm Rollback'}
            </Button>
            {correctionError && <div className="text-red-500 mt-2">{correctionError}</div>}
            {correctionSuccess && <div className="text-green-600 mt-2">{correctionSuccess}</div>}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ManualDataCorrection; 