import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

const UsersAdminPage: React.FC = () => {
  const { users, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filtering
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.profiles.first_name + ' ' + user.profiles.last_name).toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? user.profiles.role === roleFilter : true;
    const matchesStatus = statusFilter ? (statusFilter === 'verified' ? user.profiles.is_verified : !user.profiles.is_verified) : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  // Bulk selection logic
  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.id));
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds(selectedUserIds.filter(id => !paginatedUsers.some(u => u.id === id)));
    } else {
      setSelectedUserIds([
        ...selectedUserIds,
        ...paginatedUsers.filter(u => !selectedUserIds.includes(u.id)).map(u => u.id)
      ]);
    }
  };
  const handleSelectUser = (id: string) => {
    setSelectedUserIds(selectedUserIds.includes(id)
      ? selectedUserIds.filter(uid => uid !== id)
      : [...selectedUserIds, id]);
  };
  const handleBulkDeactivate = async () => {
    setBulkLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: false })
      .in('id', selectedUserIds);
    setBulkLoading(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to deactivate users.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Selected users deactivated.' });
      setSelectedUserIds([]);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        {/* Bulk Action Bar */}
        {selectedUserIds.length > 0 && (
          <div className="mb-4 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded px-4 py-2">
            <span>{selectedUserIds.length} selected</span>
            <button
              className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 disabled:opacity-50"
              onClick={handleBulkDeactivate}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Deactivating...' : 'Deactivate'}
            </button>
            {/* Add more bulk actions here */}
            <button
              className="ml-auto text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedUserIds([])}
            >
              Clear
            </button>
          </div>
        )}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        {loading ? (
          <div>Loading users...</div>
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
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">KYC Level</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-4 py-2">{user.profiles.first_name} {user.profiles.last_name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.profiles.role}</td>
                    <td className="px-4 py-2">{user.profiles.is_verified ? 'Verified' : 'Unverified'}</td>
                    <td className="px-4 py-2">{user.profiles.kyc_level}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2">View</button>
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
    </AdminLayout>
  );
};

export default UsersAdminPage; 