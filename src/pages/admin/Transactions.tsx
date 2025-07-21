import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, Flag, Snowflake } from 'lucide-react';

const PAGE_SIZE = 10;

const TransactionsAdminPage: React.FC = () => {
  const { transactions, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileNote, setReconcileNote] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [flagLoading, setFlagLoading] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);

  // Suspicious filter: high amount, failed, or >3 tx in 1hr for same user
  const suspiciousTxIds = (() => {
    const ids = new Set<string>();
    transactions.forEach(tx => {
      if (tx.amount > 1000000 || tx.status === 'failed') ids.add(tx.id);
    });
    // Rapid repeats
    const userTxMap: { [uid: string]: number[] } = {};
    transactions.forEach(tx => {
      if (!userTxMap[tx.user_id]) userTxMap[tx.user_id] = [];
      userTxMap[tx.user_id].push(new Date(tx.created_at).getTime());
    });
    Object.values(userTxMap).forEach(times => {
      times.sort();
      for (let i = 2; i < times.length; i++) {
        if (times[i] - times[i-2] < 60*60*1000) {
          ids.add(transactions.find(tx => new Date(tx.created_at).getTime() === times[i])?.id!);
          ids.add(transactions.find(tx => new Date(tx.created_at).getTime() === times[i-1])?.id!);
          ids.add(transactions.find(tx => new Date(tx.created_at).getTime() === times[i-2])?.id!);
        }
      }
    });
    return ids;
  })();

  // Filtering
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.profiles.first_name + ' ' + tx.profiles.last_name).toLowerCase().includes(search.toLowerCase()) ||
      (tx.profiles.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? tx.status === statusFilter : true;
    const matchesType = typeFilter ? tx.transaction_type === typeFilter : true;
    const matchesSuspicious = suspiciousOnly ? suspiciousTxIds.has(tx.id) : true;
    return matchesSearch && matchesStatus && matchesType && matchesSuspicious;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  // Bulk selection logic
  const isAllSelected = paginatedTransactions.length > 0 && paginatedTransactions.every(tx => selectedTxIds.includes(tx.id));
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTxIds(selectedTxIds.filter(id => !paginatedTransactions.some(tx => tx.id === id)));
    } else {
      setSelectedTxIds([
        ...selectedTxIds,
        ...paginatedTransactions.filter(tx => !selectedTxIds.includes(tx.id)).map(tx => tx.id)
      ]);
    }
  };
  const handleSelectTx = (id: string) => {
    setSelectedTxIds(selectedTxIds.includes(id)
      ? selectedTxIds.filter(tid => tid !== id)
      : [...selectedTxIds, id]);
  };
  const handleBulkRetry = async () => {
    setBulkLoading(true);
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'pending' })
      .in('id', selectedTxIds);
    setBulkLoading(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to retry transactions.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Selected transactions set to retry.' });
      setSelectedTxIds([]);
    }
  };

  const handleViewDetails = (tx: any) => {
    setSelectedTx(tx);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTx(null);
  };
  const handleForceComplete = async () => {
    if (!selectedTx) return;
    setForceLoading(true);
    try {
      const res = await fetch('/functions/force-complete-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: selectedTx.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Success', description: data.message });
        setSelectedTx({ ...selectedTx, status: 'completed' });
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to force complete.' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error' });
    } finally {
      setForceLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!selectedTx) return;
    setReconcileLoading(true);
    setReconcileNote(null);
    try {
      let endpoint = '';
      if (selectedTx.transaction_type === 'deposit') {
        if (selectedTx.description?.toLowerCase().includes('flutterwave')) {
          endpoint = '/functions/reconcile-flutterwave-wallet-funding';
        } else if (selectedTx.description?.toLowerCase().includes('paystack')) {
          endpoint = '/functions/reconcile-paystack-wallet-funding';
        } else {
          setReconcileNote('Unknown funding provider.');
          setReconcileLoading(false);
          return;
        }
      } else {
        setReconcileNote('Reconciliation only available for wallet funding transactions.');
        setReconcileLoading(false);
        return;
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: selectedTx.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Reconciled', description: data.note });
        setSelectedTx({ ...selectedTx, status: data.newStatus });
        setReconcileNote(data.note);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to reconcile.' });
        setReconcileNote(data.error || 'Failed to reconcile.');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error' });
      setReconcileNote(err.message || 'Network error');
    } finally {
      setReconcileLoading(false);
    }
  };

  const handleOpenProfile = async (userId: string) => {
    setProfileModalOpen(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfileUser(data || null);
  };
  const handleCloseProfile = () => {
    setProfileModalOpen(false);
    setProfileUser(null);
  };
  const handleFlagUser = async (userId: string) => {
    setFlagLoading(true);
    await supabase.from('profiles').update({ flagged: true }).eq('id', userId);
    setFlagLoading(false);
    toast({ title: 'User flagged', description: 'User has been flagged for review.' });
  };
  const handleFreezeUser = async (userId: string) => {
    setFreezeLoading(true);
    await supabase.from('profiles').update({ is_frozen: true }).eq('id', userId);
    setFreezeLoading(false);
    toast({ title: 'User frozen', description: 'User account has been frozen.' });
  };
  function toCSV(rows: any[], columns: { key: string, label: string }[]) {
    const header = columns.map(col => `"${col.label}"`).join(',');
    const body = rows.map(row =>
      columns.map(col => `"${(row[col.key] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    return `${header}\n${body}`;
  }
  function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  const handleExportCSV = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'user', label: 'User' },
      { key: 'email', label: 'Email' },
      { key: 'transaction_type', label: 'Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date' },
      { key: 'description', label: 'Description' },
      { key: 'reference', label: 'Reference' },
    ];
    const rows = filteredTransactions.map(tx => ({
      id: tx.id,
      user: `${tx.profiles.first_name} ${tx.profiles.last_name}`,
      email: tx.profiles.email || '',
      transaction_type: tx.transaction_type,
      amount: tx.amount,
      status: tx.status,
      created_at: tx.created_at,
      description: tx.description,
      reference: tx.reference,
    }));
    const csv = toCSV(rows, columns);
    downloadCSV('transactions.csv', csv);
  };
  function statusColor(status: string) {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'failed') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }
  function typeColor(type: string) {
    if (type === 'bank_transfer') return 'bg-blue-100 text-blue-800';
    if (type === 'bill_payment') return 'bg-purple-100 text-purple-800';
    if (type === 'card_payment') return 'bg-pink-100 text-pink-800';
    if (type === 'wallet_funding') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        {/* Bulk Action Bar */}
        {selectedTxIds.length > 0 && (
          <div className="mb-4 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded px-4 py-2">
            <span>{selectedTxIds.length} selected</span>
            <button
              className="bg-orange-100 text-orange-700 px-4 py-2 rounded hover:bg-orange-200 disabled:opacity-50"
              onClick={handleBulkRetry}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Retrying...' : 'Retry'}
            </button>
            {/* Add more bulk actions here */}
            <button
              className="ml-auto text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedTxIds([])}
            >
              Clear
            </button>
          </div>
        )}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by user, email, reference, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="bill_payment">Bill Payment</option>
            <option value="card_payment">Card Payment</option>
            <option value="wallet_funding">Wallet Funding</option>
          </select>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={suspiciousOnly} onChange={e => setSuspiciousOnly(e.target.checked)} /> Suspicious Only
          </label>
          <Button size="sm" variant="outline" className="ml-2" onClick={handleExportCSV} title="Export filtered transactions to CSV">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
        {loading ? (
            <div>Loading transactions...</div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.includes(tx.id)}
                        onChange={() => handleSelectTx(tx.id)}
                      />
                    </td>
                    <td className="px-4 py-2">{tx.id}</td>
                    <td className="px-4 py-2">{tx.profiles.first_name} {tx.profiles.last_name}
                      <Button size="icon" variant="ghost" className="ml-1 p-1" onClick={() => handleOpenProfile(tx.user_id)} title="Quick View Profile">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="px-4 py-2"><Badge className={typeColor(tx.transaction_type)}>{tx.transaction_type}</Badge></td>
                    <td className="px-4 py-2">₦{tx.amount.toLocaleString()}</td>
                    <td className="px-4 py-2"><Badge className={statusColor(tx.status)}>{tx.status}</Badge></td>
                    <td className="px-4 py-2">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => handleViewDetails(tx)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <div>
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`px-3 py-1 border rounded ${page === i + 1 ? 'bg-blue-100 text-blue-700' : ''}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Transaction Detail Modal */}
      {modalOpen && selectedTx && (
        <Dialog open={modalOpen} onOpenChange={v => { if (!v) handleCloseModal(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>Full details of the selected transaction</DialogDescription>
            </DialogHeader>
            <div className="mb-4">
              <div><b>ID:</b> {selectedTx.id}</div>
              <div><b>User:</b> {selectedTx.profiles.first_name} {selectedTx.profiles.last_name}</div>
              <div><b>Type:</b> {selectedTx.transaction_type}</div>
              <div><b>Amount:</b> ₦{selectedTx.amount.toLocaleString()}</div>
              <div><b>Status:</b> {selectedTx.status}</div>
              <div><b>Date:</b> {new Date(selectedTx.created_at).toLocaleDateString()}</div>
              <div><b>Description:</b> {selectedTx.description}</div>
              <div><b>Reference:</b> {selectedTx.reference}</div>
            </div>
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={() => handleOpenProfile(selectedTx.user_id)} title="Quick View Profile">
                <Eye className="w-4 h-4 mr-1" /> User Profile
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleFlagUser(selectedTx.user_id)} disabled={flagLoading} title="Flag User">
                <Flag className="w-4 h-4 mr-1" /> {flagLoading ? 'Flagging...' : 'Flag User'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleFreezeUser(selectedTx.user_id)} disabled={freezeLoading} title="Freeze User">
                <Snowflake className="w-4 h-4 mr-1" /> {freezeLoading ? 'Freezing...' : 'Freeze User'}
              </Button>
              {selectedTx.status === 'pending' && (
                <Button size="sm" className="bg-green-100 text-green-700" onClick={handleForceComplete} disabled={forceLoading}>
                  {forceLoading ? 'Completing...' : 'Force Complete'}
                </Button>
              )}
              {selectedTx.transaction_type === 'deposit' && (
                <Button size="sm" className="bg-blue-100 text-blue-700" onClick={handleReconcile} disabled={reconcileLoading}>
                  {reconcileLoading ? 'Reconciling...' : 'Reconcile'}
                </Button>
              )}
            </div>
            {reconcileNote && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-blue-800 text-sm mb-2">
                {reconcileNote}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={profileModalOpen} onOpenChange={v => { if (!v) handleCloseProfile(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Quick view of user details</DialogDescription>
          </DialogHeader>
          {profileUser ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold">
                {profileUser.first_name?.[0]}{profileUser.last_name?.[0]}
              </div>
              <div className="text-lg font-semibold">{profileUser.first_name} {profileUser.last_name}</div>
              <div className="text-sm text-gray-500">{profileUser.email}</div>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                <div><span className="font-medium">Phone:</span> {profileUser.phone || 'N/A'}</div>
                <div><span className="font-medium">DOB:</span> {profileUser.date_of_birth || 'N/A'}</div>
                <div><span className="font-medium">State:</span> {profileUser.state || 'N/A'}</div>
                <div><span className="font-medium">KYC Level:</span> {profileUser.kyc_level || 'N/A'}</div>
                <div><span className="font-medium">Verified:</span> {profileUser.is_verified ? 'Yes' : 'No'}</div>
                {profileUser.username && <div><span className="font-medium">Username:</span> {profileUser.username}</div>}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">Loading...</div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default TransactionsAdminPage; 