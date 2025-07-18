import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '@/integrations/supabase/client';

interface AdminWalletsTabProps {
  mode?: string;
}

const AdminWalletsTab: React.FC<AdminWalletsTabProps> = ({ mode }) => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  const [limitModalWallet, setLimitModalWallet] = useState<any>(null);
  const [newLimit, setNewLimit] = useState('');
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wallets').select('*');
    if (!error) setWallets(data || []);
    setLoading(false);
  };

  const handleAdjustWallet = async (wallet: any) => {
    setAdjustLoading(true);
    setAdjustError('');
    try {
      const amount = parseFloat(adjustAmount);
      if (isNaN(amount) || amount <= 0) {
        setAdjustError('Enter a valid amount');
        setAdjustLoading(false);
        return;
      }
      let newBalance = wallet.balance;
      if (adjustType === 'add') {
        newBalance += amount;
      } else {
        if (wallet.balance < amount) {
          setAdjustError('Insufficient wallet balance');
          setAdjustLoading(false);
          return;
        }
        newBalance -= amount;
      }
      const { error } = await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
      if (error) {
        setAdjustError(error.message);
      } else {
        setAdjustAmount('');
        setSelectedWallet(null);
        fetchWallets();
      }
    } catch (err: any) {
      setAdjustError(err.message || 'Error updating wallet');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleFreezeWallet = async (wallet: any, freeze: boolean) => {
    setLoading(true);
    // Only update if 'is_frozen' is a valid column
    await supabase.from('wallets').update({ is_frozen: freeze }).eq('id', wallet.id);
    fetchWallets();
    setLoading(false);
  };

  const handleSetLimit = async (wallet: any) => {
    setLimitLoading(true);
    setLimitError('');
    const amount = parseFloat(newLimit);
    if (isNaN(amount) || amount <= 0) {
      setLimitError('Enter a valid limit');
      setLimitLoading(false);
      return;
    }
    // Upsert into transaction_limits table, onConflict should be a string not array
    const { error } = await supabase.from('transaction_limits').upsert({ user_id: wallet.user_id, daily_send_limit: amount }, { onConflict: 'user_id' });
    if (error) {
      setLimitError(error.message);
    } else {
      setLimitModalWallet(null);
      setNewLimit('');
    }
    setLimitLoading(false);
  };

  // Staff Permissions mode
  if (mode === 'staff') {
    // Placeholder: fetch from 'staff' table if exists
    const [staff, setStaff] = useState<any[]>([]);
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [newStaffEmail, setNewStaffEmail] = useState('');
    const [newStaffRole, setNewStaffRole] = useState('admin');
    useEffect(() => {
      // TODO: fetch real staff data from Supabase
      setStaff([
        { id: 1, email: 'admin@getpae.com', role: 'superadmin' },
        { id: 2, email: 'support@getpae.com', role: 'support' },
      ]);
    }, []);
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="mb-4" onClick={() => setStaffModalOpen(true)}>Add Staff</Button>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(member => (
                  <tr key={member.id} className="border-t">
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="destructive">Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {staffModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-xl font-bold mb-2">Add Staff</h2>
              <Input
                type="email"
                placeholder="Staff email"
                value={newStaffEmail}
                onChange={e => setNewStaffEmail(e.target.value)}
                className="mb-2"
              />
              <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} className="border rounded px-2 py-1 mb-2">
                <option value="admin">Admin</option>
                <option value="support">Support</option>
                <option value="compliance">Compliance</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => setStaffModalOpen(false)}>Add</Button>
                <Button size="sm" variant="outline" onClick={() => setStaffModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Wallets Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading wallets...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(wallet => (
                  <tr key={wallet.id} className="border-t">
                    <td>{wallet.user_id}</td>
                    <td>{wallet.currency}</td>
                    <td>&#8358;{wallet.balance.toLocaleString()}</td>
                    <td>{wallet.is_frozen ? 'Frozen' : 'Active'}</td>
                    <td>
                      <Button size="sm" onClick={() => setSelectedWallet(wallet)}>Adjust</Button>
                      <Button size="sm" variant="outline" onClick={() => handleFreezeWallet(wallet, !wallet.is_frozen)}>
                        {wallet.is_frozen ? 'Unfreeze' : 'Freeze'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setLimitModalWallet(wallet)}>
                        Set Limit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-2">Adjust Wallet</h2>
            <p><b>User ID:</b> {selectedWallet.user_id}</p>
            <p><b>Currency:</b> {selectedWallet.currency}</p>
            <p><b>Current Balance:</b> &#8358;{selectedWallet.balance.toLocaleString()}</p>
            <div className="mt-4 flex gap-2">
              <select value={adjustType} onChange={e => setAdjustType(e.target.value as 'add' | 'subtract')} className="border rounded px-2 py-1">
                <option value="add">Fund</option>
                <option value="subtract">Reverse</option>
              </select>
              <Input
                type="number"
                placeholder="Amount"
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={() => handleAdjustWallet(selectedWallet)} disabled={adjustLoading}>
                {adjustLoading ? 'Processing...' : 'Submit'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedWallet(null)}>Cancel</Button>
            </div>
            {adjustError && <div className="text-red-600 mt-2">{adjustError}</div>}
          </div>
        </div>
      )}
      {limitModalWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-2">Set Daily Send Limit</h2>
            <p><b>User ID:</b> {limitModalWallet.user_id}</p>
            <Input
              type="number"
              placeholder="New daily send limit"
              value={newLimit}
              onChange={e => setNewLimit(e.target.value)}
              className="mt-2"
            />
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => handleSetLimit(limitModalWallet)} disabled={limitLoading}>
                {limitLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLimitModalWallet(null)}>Cancel</Button>
            </div>
            {limitError && <div className="text-red-600 mt-2">{limitError}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWalletsTab; 