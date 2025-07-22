import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { useEffect } from 'react';
import { useAuditLog } from '@/hooks/useAuditLog';
// import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user: currentUser, role: currentRole } = useAuth();
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [roleEditUser, setRoleEditUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviteLoading, setInviteLoading] = useState(false);
  const { logAction } = useAuditLog();
  // Add state for adminUsers
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(true);
  // Add state to store userRoles
  const [userRoles, setUserRoles] = useState<{ [userId: string]: 'admin' | 'moderator' | 'user' }>({});
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyTarget, setNotifyTarget] = useState<'all' | 'admin' | 'moderator' | 'user' | 'selected'>('all');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySelected, setNotifySelected] = useState<string[]>([]);

  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(() => !!sessionStorage.getItem('adminSession'));

  // Impersonate user
  const handleImpersonate = async (targetUserId: string) => {
    // Store current session in sessionStorage
    const session = localStorage.getItem('supabase.auth.token');
    if (session) sessionStorage.setItem('adminSession', session);
    try {
      const res = await fetch('/functions/v1/admin-impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId }),
      });
      if (!res.ok) throw new Error('Failed to get impersonation token');
      const data = await res.json();
      // TODO: Use Supabase signInWithIdToken or similar with data.token
      // Placeholder: just show a toast
      toast({ title: 'Impersonation', description: `Received token: ${data.token}` });
      setIsImpersonating(true);
    } catch (err: any) {
      toast({ title: 'Impersonation Failed', description: err.message, variant: 'destructive' });
    }
  };

  // Revert impersonation
  const handleRevertImpersonation = () => {
    const adminSession = sessionStorage.getItem('adminSession');
    if (adminSession) {
      localStorage.setItem('supabase.auth.token', adminSession);
      sessionStorage.removeItem('adminSession');
      window.location.reload();
    }
  };

  // Fetch user_roles for all users on mount
  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase.from('user_roles').select('user_id, role');
      if (data) {
        const rolesMap: { [userId: string]: 'admin' | 'moderator' | 'user' } = {};
        data.forEach((r: any) => { rolesMap[r.user_id] = r.role; });
        setUserRoles(rolesMap);
      }
    };
    fetchRoles();
  }, [users]);

  // Fetch users via Edge Function
  useEffect(() => {
    const fetchAdminUsers = async () => {
      setAdminUsersLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('admin-users', {});
        if (error) throw error;
        setAdminUsers(data.users || []);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
      } finally {
        setAdminUsersLoading(false);
      }
    };
    fetchAdminUsers();
  }, []);

  // Filtering
  const filteredUsers = adminUsers.filter((user) => {
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

  const openEditRoleModal = (user: any) => {
    setRoleEditUser(user);
    setNewRole(user.profiles.role || 'user');
    setEditRoleModalOpen(true);
  };
  const closeEditRoleModal = () => {
    setEditRoleModalOpen(false);
    setRoleEditUser(null);
    setNewRole('');
  };
  const handleRoleChange = async () => {
    if (!roleEditUser) return;
    setRoleLoading(true);
    const oldRole = userRoles[roleEditUser.id] || 'user';
    // Ensure newRole is a valid role
    const validRoles = ['admin', 'moderator', 'user'] as const;
    if (!validRoles.includes(newRole as any)) {
      toast({ title: 'Error', description: 'Invalid role selected', variant: 'destructive' });
      setRoleLoading(false);
      return;
    }
    await supabase.from('user_roles').upsert({ user_id: roleEditUser.id, role: newRole as 'admin' | 'moderator' | 'user' });
    await logAction({
      action: 'ADMIN_ROLE_CHANGED',
      table_name: 'user_roles',
      record_id: roleEditUser.id,
      old_data: { role: oldRole },
      new_data: { role: newRole }
    });
    setRoleLoading(false);
    toast({ title: 'Role updated', description: `User role changed to ${newRole}` });
    closeEditRoleModal();
  };
  const handleRevokeAdmin = async () => {
    if (!roleEditUser) return;
    setRoleLoading(true);
    const oldRole = userRoles[roleEditUser.id] || 'user';
    await supabase.from('user_roles').upsert({ user_id: roleEditUser.id, role: 'user' });
    await logAction({
      action: 'ADMIN_ROLE_REVOKED',
      table_name: 'user_roles',
      record_id: roleEditUser.id,
      old_data: { role: oldRole },
      new_data: { role: 'user' }
    });
    setRoleLoading(false);
    toast({ title: 'Admin access revoked', description: 'User is now a regular user.' });
    closeEditRoleModal();
  };
  function roleColor(role: string) {
    if (role === 'admin') return 'bg-purple-100 text-purple-800';
    if (role === 'super-admin') return 'bg-green-100 text-green-800';
    if (role === 'support') return 'bg-blue-100 text-blue-800';
    if (role === 'moderator') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  const openInviteModal = () => {
    setInviteModalOpen(true);
    setInviteEmail('');
    setInviteRole('admin');
  };
  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteEmail('');
    setInviteRole('admin');
  };
  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const validRoles = ['admin', 'moderator', 'user'] as const;
      if (!validRoles.includes(inviteRole as any)) {
        toast({ title: 'Error', description: 'Invalid role selected', variant: 'destructive' });
        setInviteLoading(false);
        return;
      }
      // Call the admin-invite Edge Function
      const { data, error } = await supabase.functions.invoke('admin-invite', {
        body: { email: inviteEmail, role: inviteRole },
      });
      if (error || !data.success) throw error || new Error('Failed to invite admin');
      await logAction({
        action: 'ADMIN_INVITED',
        table_name: 'user_roles',
        record_id: data.user_id || inviteEmail,
        old_data: null,
        new_data: { role: inviteRole, email: inviteEmail }
      });
      toast({ title: 'Invite sent', description: `Invitation sent to ${inviteEmail}` });
      closeInviteModal();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to invite admin', variant: 'destructive' });
    } finally {
      setInviteLoading(false);
    }
  };

  const openNotifyModal = () => {
    setNotifyModalOpen(true);
    setNotifyMessage('');
    setNotifyTarget('all');
    setNotifySelected([]);
  };
  const closeNotifyModal = () => {
    setNotifyModalOpen(false);
    setNotifyMessage('');
    setNotifyTarget('all');
    setNotifySelected([]);
  };
  const handleSendNotification = async () => {
    setNotifyLoading(true);
    try {
      let userIds: string[] = [];
      if (notifyTarget === 'all') {
        userIds = adminUsers.map(u => u.id);
      } else if (notifyTarget === 'selected') {
        userIds = notifySelected;
      } else {
        userIds = adminUsers.filter(u => userRoles[u.id] === notifyTarget).map(u => u.id);
      }
      // Insert notifications for each user
      const inserts = userIds.map(user_id => ({
        user_id,
        title: 'Admin Notification',
        message: notifyMessage,
        type: 'admin',
        status: 'unread',
        channels: ['in-app'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('notifications').insert(inserts);
      if (error) throw error;
      toast({ title: 'Notification sent', description: `Message sent to ${userIds.length} user(s)` });
      closeNotifyModal();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to send notification', variant: 'destructive' });
    } finally {
      setNotifyLoading(false);
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
        {adminUsersLoading ? (
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
                    <td className="px-4 py-2">
                      <Badge className={roleColor(userRoles[user.id])}>{userRoles[user.id] || 'user'}</Badge>
                    </td>
                    <td className="px-4 py-2">{user.profiles.is_verified ? 'Verified' : 'Unverified'}</td>
                    <td className="px-4 py-2">{user.profiles.kyc_level}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2">View</button>
                      {currentRole === 'admin' && user.id !== currentUser?.id && (
                        <Button size="sm" onClick={() => handleImpersonate(user.id)}>
                          Impersonate
                        </Button>
                      )}
                      {isImpersonating && (
                        <Button variant="destructive" onClick={handleRevertImpersonation}>
                          Revert to Admin
                        </Button>
                      )}
                      {currentUser?.role === 'super-admin' && (
                        <Button size="sm" variant="outline" onClick={() => openEditRoleModal(user)}>
                          Edit Role
                        </Button>
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
      {currentUser?.role === 'super-admin' && (
        <Button className="mb-4" onClick={openInviteModal}>
          Invite Admin
        </Button>
      )}
      {currentUser?.role === 'admin' && (
        <Button className="mb-4 mr-2" onClick={openNotifyModal}>
          Send Notification
        </Button>
      )}
      <Dialog open={editRoleModalOpen} onOpenChange={v => { if (!v) closeEditRoleModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>Change or revoke this user's admin role</DialogDescription>
          </DialogHeader>
          {roleEditUser && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">{roleEditUser.profiles.first_name} {roleEditUser.profiles.last_name}</div>
              <div className="text-sm text-gray-500">{roleEditUser.email}</div>
              <div>
                <label className="block font-medium mb-1">Role</label>
                <select className="border rounded px-3 py-2 w-full" value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'moderator' | 'user')}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRoleChange} disabled={roleLoading}>
                  {roleLoading ? 'Saving...' : 'Save'}
                </Button>
                {roleEditUser.profiles.role !== 'user' && (
                  <Button variant="destructive" onClick={handleRevokeAdmin} disabled={roleLoading}>
                    {roleLoading ? 'Revoking...' : 'Revoke Admin'}
                  </Button>
                )}
                <Button variant="outline" onClick={closeEditRoleModal}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={inviteModalOpen} onOpenChange={v => { if (!v) closeInviteModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Admin</DialogTitle>
            <DialogDescription>Send an invitation to a new admin by email and assign a role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input type="email" className="border rounded px-3 py-2 w-full" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Role</label>
              <select className="border rounded px-3 py-2 w-full" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'admin' | 'moderator' | 'user')}>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail}>
                {inviteLoading ? 'Inviting...' : 'Send Invite'}
              </Button>
              <Button variant="outline" onClick={closeInviteModal}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={notifyModalOpen} onOpenChange={v => { if (!v) closeNotifyModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a message to users by role or selection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Message</label>
              <textarea className="border rounded px-3 py-2 w-full" value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={3} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Recipients</label>
              <select className="border rounded px-3 py-2 w-full" value={notifyTarget} onChange={e => setNotifyTarget(e.target.value as any)}>
                <option value="all">All Users</option>
                <option value="admin">Admins</option>
                <option value="moderator">Moderators</option>
                <option value="user">Regular Users</option>
                <option value="selected">Selected Users</option>
              </select>
            </div>
            {notifyTarget === 'selected' && (
              <div>
                <label className="block font-medium mb-1">Select Users</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {adminUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 mb-1">
                      <input type="checkbox" checked={notifySelected.includes(u.id)} onChange={e => {
                        setNotifySelected(s => e.target.checked ? [...s, u.id] : s.filter(id => id !== u.id));
                      }} />
                      {u.profiles.first_name} {u.profiles.last_name} <span className="text-xs text-gray-400">({u.email})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSendNotification} disabled={notifyLoading || !notifyMessage}>
                {notifyLoading ? 'Sending...' : 'Send'}
              </Button>
              <Button variant="outline" onClick={closeNotifyModal}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UsersAdminPage; 