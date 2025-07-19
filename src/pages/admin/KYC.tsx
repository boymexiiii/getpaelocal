import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

const KYCAdminPage: React.FC = () => {
  const { kycApplications, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [selectedKycIds, setSelectedKycIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtering
  const filteredKyc = kycApplications.filter((k) => {
    const matchesSearch =
      (k.profiles.first_name + ' ' + k.profiles.last_name).toLowerCase().includes(search.toLowerCase()) ||
      k.profiles.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? k.status === statusFilter : true;
    const matchesLevel = levelFilter ? String(k.kyc_level) === levelFilter : true;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredKyc.length / PAGE_SIZE);
  const paginatedKyc = filteredKyc.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleApprove = async () => {
    if (!selectedKyc) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('kyc_applications')
      .update({ status: 'approved' })
      .eq('id', selectedKyc.id);
    setActionLoading(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to approve KYC.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'KYC approved.' });
      setSelectedKyc({ ...selectedKyc, status: 'approved' });
    }
  };
  const handleReject = async () => {
    if (!selectedKyc) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('kyc_applications')
      .update({ status: 'rejected' })
      .eq('id', selectedKyc.id);
    setActionLoading(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to reject KYC.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'KYC rejected.' });
      setSelectedKyc({ ...selectedKyc, status: 'rejected' });
    }
  };

  const handleViewDetails = (kyc: any) => {
    setSelectedKyc(kyc);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedKyc(null);
  };

  // Bulk selection logic
  const isAllSelected = paginatedKyc.length > 0 && paginatedKyc.every(k => selectedKycIds.includes(k.id));
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKycIds(selectedKycIds.filter(id => !paginatedKyc.some(k => k.id === id)));
    } else {
      setSelectedKycIds([
        ...selectedKycIds,
        ...paginatedKyc.filter(k => !selectedKycIds.includes(k.id)).map(k => k.id)
      ]);
    }
  };
  const handleSelectKyc = (id: string) => {
    setSelectedKycIds(selectedKycIds.includes(id)
      ? selectedKycIds.filter(kid => kid !== id)
      : [...selectedKycIds, id]);
  };
  const handleBulkApprove = async () => {
    setBulkLoading(true);
    const { error } = await supabase
      .from('kyc_applications')
      .update({ status: 'approved' })
      .in('id', selectedKycIds);
    setBulkLoading(false);
      if (error) {
      toast({ title: 'Error', description: 'Failed to approve KYC applications.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Selected KYC applications approved.' });
      setSelectedKycIds([]);
    }
  };
  const handleBulkReject = async () => {
    setBulkLoading(true);
    const { error } = await supabase
      .from('kyc_applications')
      .update({ status: 'rejected' })
      .in('id', selectedKycIds);
    setBulkLoading(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to reject KYC applications.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Selected KYC applications rejected.' });
      setSelectedKycIds([]);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">KYC Applications</h1>
        {/* Bulk Action Bar */}
        {selectedKycIds.length > 0 && (
          <div className="mb-4 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded px-4 py-2">
            <span>{selectedKycIds.length} selected</span>
            <button
              className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 disabled:opacity-50"
              onClick={handleBulkApprove}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Approving...' : 'Approve'}
            </button>
            <button
              className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 disabled:opacity-50"
              onClick={handleBulkReject}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Rejecting...' : 'Reject'}
            </button>
            {/* Add more bulk actions here */}
            <button
              className="ml-auto text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedKycIds([])}
            >
              Clear
            </button>
          </div>
        )}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by user or email..."
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
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
        </div>
        {loading ? (
            <div>Loading KYC applications...</div>
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
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Level</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Submitted</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedKyc.map((k) => (
                  <tr key={k.id} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedKycIds.includes(k.id)}
                        onChange={() => handleSelectKyc(k.id)}
                      />
                    </td>
                    <td className="px-4 py-2">{k.profiles.first_name} {k.profiles.last_name}</td>
                    <td className="px-4 py-2">{k.profiles.email}</td>
                    <td className="px-4 py-2">{k.kyc_level}</td>
                    <td className="px-4 py-2">{k.status}</td>
                    <td className="px-4 py-2">{new Date(k.submitted_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => handleViewDetails(k)}>View</button>
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

      {/* KYC Detail Modal */}
      {modalOpen && selectedKyc && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={handleCloseModal}>&times;</button>
            <h2 className="text-xl font-bold mb-2">KYC Application Details</h2>
            <div className="mb-4">
              <div><b>ID:</b> {selectedKyc.id}</div>
              <div><b>User:</b> {selectedKyc.profiles.first_name} {selectedKyc.profiles.last_name}</div>
              <div><b>Status:</b> {selectedKyc.status}</div>
              <div><b>Level:</b> {selectedKyc.kyc_level}</div>
              <div><b>Submitted:</b> {new Date(selectedKyc.submitted_at).toLocaleDateString()}</div>
              <div><b>Occupation:</b> {selectedKyc.occupation}</div>
              <div><b>BVN Verified:</b> {selectedKyc.bvn_verified ? 'Yes' : 'No'}</div>
              <div><b>Reviewer Notes:</b> {selectedKyc.reviewer_notes || '-'}</div>
              <div><b>Rejection Reason:</b> {selectedKyc.rejection_reason || '-'}</div>
            </div>
            <div className="flex gap-2 mb-4">
              {selectedKyc.status === 'submitted' && (
                <>
                  <button
                    className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 disabled:opacity-50"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 disabled:opacity-50"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                </>
              )}
            </div>
          </div>
    </div>
      )}
    </AdminLayout>
  );
};

export default KYCAdminPage; 