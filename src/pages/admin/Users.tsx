import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const UsersAdminPage = () => {
  const { user, role, loading, isAdminRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdminRole(role))) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdminRole(role)) return <div>Access denied</div>;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.from('admin_user_view').select('*').order('user_created_at', { ascending: false });
      if (error) {
        console.error('Error fetching users:', error);
      }
      setUsers(data || []);
      console.log('Fetched users:', data);
    } catch (err) {
      console.error('Unexpected error fetching users:', err);
    }
    setLoadingUsers(false);
  };

  const filteredUsers = users.filter(u =>
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loadingUsers ? (
            <div>Loading users...</div>
          ) : users.length === 0 ? (
            <div>No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>KYC</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-t">
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.kyc_level}</td>
                    <td>{user.is_verified ? 'Yes' : 'No'}</td>
                    <td>{user.active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <Button size="sm" onClick={() => setSelectedUser(user)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-2">User Details</h2>
            <p><b>Name:</b> {selectedUser.first_name} {selectedUser.last_name}</p>
            <p><b>Email:</b> {selectedUser.email}</p>
            <p><b>KYC:</b> {selectedUser.kyc_level}</p>
            <p><b>Verified:</b> {selectedUser.is_verified ? 'Yes' : 'No'}</p>
            <p><b>Status:</b> {selectedUser.active ? 'Active' : 'Inactive'}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedUser(null)}>Close</Button>
              <Button size="sm" onClick={() => {/* TODO: Approve KYC */}}>Approve KYC</Button>
              <Button size="sm" variant="destructive" onClick={() => {/* TODO: Suspend user */}}>Suspend</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdminPage; 