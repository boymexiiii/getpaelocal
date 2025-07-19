import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  // Filtering
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.profiles.first_name + ' ' + tx.profiles.last_name).toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? tx.status === statusFilter : true;
    const matchesType = typeFilter ? tx.transaction_type === typeFilter : true;
    return matchesSearch && matchesStatus && matchesType;
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
            placeholder="Search by user or transaction ID..."
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
            {/* Add more types as needed */}
          </select>
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
                    <td className="px-4 py-2">{tx.profiles.first_name} {tx.profiles.last_name}</td>
                    <td className="px-4 py-2">{tx.transaction_type}</td>
                    <td className="px-4 py-2">₦{tx.amount.toLocaleString()}</td>
                    <td className="px-4 py-2">{tx.status}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={handleCloseModal}>&times;</button>
            <h2 className="text-xl font-bold mb-2">Transaction Details</h2>
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
              {selectedTx.status === 'pending' && (
                <button
                  className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 disabled:opacity-50"
                  onClick={handleForceComplete}
                  disabled={forceLoading}
                >
                  {forceLoading ? 'Completing...' : 'Force Complete'}
                </button>
              )}
              {selectedTx.transaction_type === 'deposit' && (
                <button
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 disabled:opacity-50"
                  onClick={handleReconcile}
                  disabled={reconcileLoading}
                >
                  {reconcileLoading ? 'Reconciling...' : 'Reconcile'}
                </button>
              )}
            </div>
            {reconcileNote && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-blue-800 text-sm mb-2">
                {reconcileNote}
              </div>
            )}
          </div>
    </div>
      )}
    </AdminLayout>
  );
};

export default TransactionsAdminPage; 