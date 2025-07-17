
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserCheck, Ban, Shield, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useNotifications } from '@/hooks/useNotifications';

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    is_verified: boolean;
    kyc_level: number;
  };
}

interface AdminUserActionsProps {
  user: User;
  onUserUpdate: () => void;
}

const AdminUserActions: React.FC<AdminUserActionsProps> = ({ user, onUserUpdate }) => {
  const { toast } = useToast();
  const { logWalletUpdate, logAction } = useAuditLog();
  const { sendRealTimeNotification } = useNotifications();
  const [wallets, setWallets] = useState<any[]>([]);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  
  useEffect(() => {
    if (detailsOpen) {
      // Fetch wallets
      supabase.from('wallets').select('*').eq('user_id', user.id).then(({ data }) => setWallets(data || []));
      // Fetch KYC documents
      supabase.from('kyc_documents').select('*').eq('user_id', user.id).then(({ data }) => setKycDocs(data || []));
      // Fetch recent transactions
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10).then(({ data }) => setTransactions(data || []));
    }
  }, [detailsOpen, user.id]);

  const handleVerifyUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true, kyc_level: 2 })
        .eq('id', user.id);

      if (error) throw error;

      await logAction({
        action: 'ADMIN_VERIFY_USER',
        table_name: 'profiles',
        record_id: user.id,
        old_data: { is_verified: user.profiles.is_verified, kyc_level: user.profiles.kyc_level },
        new_data: { is_verified: true, kyc_level: 2 }
      });

      await sendRealTimeNotification({
        userId: user.id,
        type: 'kyc_update',
        title: 'KYC Verified',
        message: 'Your account has been verified by an admin.',
        channels: ['push', 'email']
      });

      toast({
        title: "User Verified",
        description: "User has been successfully verified",
      });
      
      onUserUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify user",
        variant: "destructive"
      });
    }
  };

  const handleSuspendUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', user.id);

      if (error) throw error;

      await logAction({
        action: 'ADMIN_SUSPEND_USER',
        table_name: 'profiles',
        record_id: user.id,
        old_data: { is_verified: user.profiles.is_verified },
        new_data: { is_verified: false }
      });

      await sendRealTimeNotification({
        userId: user.id,
        type: 'security_alert',
        title: 'Account Suspended',
        message: 'Your account has been suspended by an admin. Contact support for details.',
        channels: ['push', 'email']
      });

      toast({
        title: "User Suspended",
        description: "User has been suspended",
      });
      
      onUserUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive"
      });
    }
  };

  const handleUpgradeKyc = async () => {
    const newKycLevel = Math.min(user.profiles.kyc_level + 1, 3);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_level: newKycLevel })
        .eq('id', user.id);

      if (error) throw error;

      await logAction({
        action: 'ADMIN_UPGRADE_KYC',
        table_name: 'profiles',
        record_id: user.id,
        old_data: { kyc_level: user.profiles.kyc_level },
        new_data: { kyc_level: newKycLevel }
      });

      await sendRealTimeNotification({
        userId: user.id,
        type: 'kyc_update',
        title: 'KYC Level Upgraded',
        message: `Your KYC level has been upgraded to ${newKycLevel} by an admin.`,
        channels: ['push', 'email']
      });

      toast({
        title: "KYC Upgraded",
        description: `User KYC level upgraded to ${newKycLevel}`,
      });
      
      onUserUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade KYC level",
        variant: "destructive"
      });
    }
  };

  const handleAdjustWallet = async () => {
    setAdjustLoading(true);
    setAdjustError('');
    try {
      const amount = parseFloat(adjustAmount);
      if (isNaN(amount) || amount <= 0) {
        setAdjustError('Enter a valid amount');
        setAdjustLoading(false);
        return;
      }
      const wallet = wallets[0]; // Assume NGN wallet for now
      if (!wallet) {
        setAdjustError('No wallet found');
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
        // Audit log
        await logWalletUpdate(adjustType === 'add' ? 'admin_topup' : 'admin_deduct', { ...wallet, balance: newBalance }, wallet.balance);
        // Notify user
        await sendRealTimeNotification({
          userId: user.id,
          type: 'wallet_funded',
          title: adjustType === 'add' ? 'Wallet Top-Up' : 'Wallet Deduction',
          message: `Your wallet was ${adjustType === 'add' ? 'credited' : 'debited'} by ₦${amount} by an admin. New balance: ₦${newBalance}`,
          channels: ['push', 'email']
        });
        toast({ title: 'Wallet Updated', description: `Wallet ${adjustType === 'add' ? 'credited' : 'debited'} by ₦${amount}` });
        setAdjustAmount('');
        setDetailsOpen(false);
        onUserUpdate();
      }
    } catch (err: any) {
      setAdjustError(err.message || 'Error updating wallet');
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={user.profiles?.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
        {user.profiles?.is_verified ? 'Verified' : 'Unverified'}
      </Badge>
      <Badge variant="outline">
        KYC Level {user.profiles?.kyc_level || 1}
      </Badge>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!user.profiles?.is_verified && (
            <DropdownMenuItem onClick={handleVerifyUser}>
              <UserCheck className="mr-2 h-4 w-4" />
              Verify User
            </DropdownMenuItem>
          )}
          {user.profiles?.is_verified && (
            <DropdownMenuItem onClick={handleSuspendUser}>
              <Ban className="mr-2 h-4 w-4" />
              Suspend User
            </DropdownMenuItem>
          )}
          {user.profiles?.kyc_level < 3 && (
            <DropdownMenuItem onClick={handleUpgradeKyc}>
              <Shield className="mr-2 h-4 w-4" />
              Upgrade KYC
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={() => setDetailsOpen(true)}>
        View Details
      </Button>
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setDetailsOpen(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-2">User Details</h2>
            <div className="mb-4">
              <div><b>Name:</b> {user.profiles?.first_name} {user.profiles?.last_name}</div>
              <div><b>Email:</b> {user.email}</div>
              <div><b>Joined:</b> {new Date(user.created_at).toLocaleDateString()}</div>
              <div><b>KYC Level:</b> {user.profiles?.kyc_level}</div>
              <div><b>Verified:</b> {user.profiles?.is_verified ? 'Yes' : 'No'}</div>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Wallets</h3>
              {wallets.length === 0 ? <div className="text-sm text-gray-500">No wallets found.</div> : (
                <ul className="text-sm mb-2">
                  {wallets.map(w => (
                    <li key={w.id}>Balance: {w.balance} {w.currency}</li>
                  ))}
                </ul>
              )}
              {/* Wallet adjustment */}
              <div className="flex items-center gap-2 mb-2">
                <select value={adjustType} onChange={e => setAdjustType(e.target.value as 'add' | 'subtract')} className="border rounded px-2 py-1">
                  <option value="add">Top Up</option>
                  <option value="subtract">Deduct</option>
                </select>
                <input type="number" min="0" step="0.01" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="Amount" className="border rounded px-2 py-1 w-24" />
                <button onClick={handleAdjustWallet} disabled={adjustLoading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">{adjustLoading ? 'Processing...' : (adjustType === 'add' ? 'Top Up' : 'Deduct')}</button>
              </div>
              {adjustError && <div className="text-xs text-red-600 mb-2">{adjustError}</div>}
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-1">KYC Documents</h3>
              {kycDocs.length === 0 ? <div className="text-sm text-gray-500">No KYC docs found.</div> : (
                <ul className="text-sm">
                  {kycDocs.map(doc => (
                    <li key={doc.id}>{doc.document_type}: <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></li>
                  ))}
                </ul>
              )}
            </div>
            {/* More KYC info */}
            <div className="mb-4">
              <h3 className="font-semibold mb-1">KYC Info</h3>
              {kycDocs.length === 0 ? <div className="text-sm text-gray-500">No KYC info found.</div> : (
                <ul className="text-sm">
                  {kycDocs.map(doc => (
                    <li key={doc.id}>{doc.document_type}: {doc.status} {doc.rejection_reason && <span className="text-red-600">(Rejected: {doc.rejection_reason})</span>}</li>
                  ))}
                </ul>
              )}
            </div>
            {/* Transaction history */}
            <div>
              <h3 className="font-semibold mb-1">Recent Transactions</h3>
              {transactions.length === 0 ? <div className="text-sm text-gray-500">No transactions found.</div> : (
                <ul className="text-sm">
                  {transactions.map(tx => (
                    <li key={tx.id}>{new Date(tx.created_at).toLocaleString()} - {tx.transaction_type} - ₦{tx.amount} - {tx.status}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserActions;
