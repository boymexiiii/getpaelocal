import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

const BillsAdminPage: React.FC = () => {
  const { transactions, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileNote, setReconcileNote] = useState<string | null>(null);

  // Only bill payment transactions
  const bills = transactions.filter(tx => tx.transaction_type === 'bill_payment');

  // Filtering
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      (bill.profiles.first_name + ' ' + bill.profiles.last_name).toLowerCase().includes(search.toLowerCase()) ||
      bill.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? bill.status === statusFilter : true;
    const matchesType = typeFilter ? (bill.bill_type === typeFilter) : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / PAGE_SIZE);
  const paginatedBills = filteredBills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleViewDetails = (bill: any) => {
    setSelectedBill(bill);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedBill(null);
  };
  const handleForceComplete = async () => {
    if (!selectedBill) return;
    setForceLoading(true);
    try {
      const res = await fetch('/functions/force-complete-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: selectedBill.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Success', description: data.message });
        setSelectedBill({ ...selectedBill, status: 'completed' });
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
    if (!selectedBill) return;
    setReconcileLoading(true);
    setReconcileNote(null);
    try {
      const res = await fetch('/functions/reconcile-bill-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: selectedBill.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Reconciled', description: data.note });
        setSelectedBill({ ...selectedBill, status: data.newStatus });
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
        <h1 className="text-2xl font-bold mb-4">Bill Payments</h1>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by user or bill ID..."
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
            <option value="">All Bill Types</option>
            <option value="airtime">Airtime</option>
            <option value="data">Data</option>
            <option value="power">Power</option>
            <option value="tv">TV</option>
            {/* Add more bill types as needed */}
          </select>
        </div>
        {loading ? (
          <div>Loading bill payments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Bill Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.map((bill) => (
                  <tr key={bill.id} className="border-t">
                    <td className="px-4 py-2">{bill.id}</td>
                    <td className="px-4 py-2">{bill.profiles.first_name} {bill.profiles.last_name}</td>
                    <td className="px-4 py-2">{bill.bill_type || '-'}</td>
                    <td className="px-4 py-2">₦{bill.amount.toLocaleString()}</td>
                    <td className="px-4 py-2">{bill.status}</td>
                    <td className="px-4 py-2">{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => handleViewDetails(bill)}>View</button>
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
      {/* Bill Payment Detail Modal */}
      {modalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={handleCloseModal}>&times;</button>
            <h2 className="text-xl font-bold mb-2">Bill Payment Details</h2>
            <div className="mb-4">
              <div><b>ID:</b> {selectedBill.id}</div>
              <div><b>User:</b> {selectedBill.profiles.first_name} {selectedBill.profiles.last_name}</div>
              <div><b>Amount:</b> ₦{selectedBill.amount.toLocaleString()}</div>
              <div><b>Status:</b> {selectedBill.status}</div>
              <div><b>Date:</b> {new Date(selectedBill.created_at).toLocaleDateString()}</div>
              <div><b>Description:</b> {selectedBill.description}</div>
              <div><b>Reference:</b> {selectedBill.reference}</div>
            </div>
            <div className="flex gap-2 mb-4">
              {selectedBill.status === 'pending' && (
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
                {reconcileLoading ? 'Reconciling...' : 'Reconcile'}
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

export default BillsAdminPage; 