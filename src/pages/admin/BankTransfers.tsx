import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

const BankTransfersAdminPage: React.FC = () => {
  const { transactions, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileNote, setReconcileNote] = useState<string | null>(null);

  // Filter for bank transfers only
  const transfers = transactions.filter(tx => tx.transaction_type === 'bank_transfer');

  // Filtering
  const filteredTransfers = transfers.filter(
    (tx) =>
      (tx.profiles.first_name + ' ' + tx.profiles.last_name).toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase())
  ).filter(
    (tx) => statusFilter ? tx.status === statusFilter : true
  );

  // Pagination
  const totalPages = Math.ceil(filteredTransfers.length / PAGE_SIZE);
  const paginatedTransfers = filteredTransfers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleView = (tx: any) => {
    setSelectedTransfer(tx);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTransfer(null);
  };
  const handleForceComplete = async () => {
    if (!selectedTransfer) return;
    setForceLoading(true);
    try {
      const res = await fetch('/functions/force-complete-bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: selectedTransfer.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Success', description: data.message });
        setSelectedTransfer({ ...selectedTransfer, status: 'completed' });
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
    if (!selectedTransfer) return;
    setReconcileLoading(true);
    setReconcileNote(null);
    try {
      const res = await fetch('/functions/reconcile-flutterwave-bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: selectedTransfer.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Reconciled', description: data.note });
        setSelectedTransfer({ ...selectedTransfer, status: data.newStatus });
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
        <h1 className="text-2xl font-bold mb-4">Bank Transfers</h1>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by user or transfer ID..."
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
        </div>
        {loading ? (
          <div>Loading bank transfers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransfers.map((tx) => (
                  <tr key={tx.id} className="border-t">
                    <td className="px-4 py-2">{tx.id}</td>
                    <td className="px-4 py-2">{tx.profiles.first_name} {tx.profiles.last_name}</td>
                    <td className="px-4 py-2">₦{tx.amount.toLocaleString()}</td>
                    <td className="px-4 py-2">{tx.status}</td>
                    <td className="px-4 py-2">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => handleView(tx)}>View</button>
                      {tx.status === 'failed' && (
                        <button className="text-orange-600 hover:underline">Retry</button>
                      )}
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
      {/* Bank Transfer Detail Modal */}
      {modalOpen && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={handleCloseModal}>&times;</button>
            <h2 className="text-xl font-bold mb-2">Bank Transfer Details</h2>
            <div className="mb-4">
              <div><b>ID:</b> {selectedTransfer.id}</div>
              <div><b>User:</b> {selectedTransfer.profiles.first_name} {selectedTransfer.profiles.last_name}</div>
              <div><b>Amount:</b> ₦{selectedTransfer.amount.toLocaleString()}</div>
              <div><b>Status:</b> {selectedTransfer.status}</div>
              <div><b>Date:</b> {new Date(selectedTransfer.created_at).toLocaleDateString()}</div>
              <div><b>Description:</b> {selectedTransfer.description}</div>
              <div><b>Reference:</b> {selectedTransfer.reference}</div>
            </div>
            <div className="flex gap-2 mb-4">
              {selectedTransfer.status === 'pending' && (
                <button
                  className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 disabled:opacity-50"
                  onClick={handleForceComplete}
                  disabled={forceLoading}
                >
                  {forceLoading ? 'Completing...' : 'Force Complete'}
                </button>
              )}
              <button
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 disabled:opacity-50"
                onClick={handleReconcile}
                disabled={reconcileLoading}
              >
                {reconcileLoading ? 'Reconciling...' : 'Reconcile with Flutterwave'}
              </button>
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

export default BankTransfersAdminPage; 