import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Staff {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

const StaffAdminPage = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'moderator'>('admin');
  const [search, setSearch] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    // Get all user_roles with role admin or moderator
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at');
    if (rolesError) {
      toast({ title: 'Error', description: rolesError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    // Get emails for each user_id
    const userIds = rolesData?.map(r => r.user_id) || [];
    let emails: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      usersData?.users.forEach((u: any) => {
        emails[u.id] = u.email;
      });
    }
    setStaff(
      (rolesData || [])
        .filter(r => r.role === 'admin' || r.role === 'moderator')
        .map(r => ({
          id: r.id,
          user_id: r.user_id,
          email: emails[r.user_id] || 'N/A',
          role: r.role,
          created_at: r.created_at
        }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line
  }, []);

  const handleAddStaff = async () => {
    if (!newStaffEmail) return;
    // Find user by email
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users.find((u: any) => u.email === newStaffEmail);
    if (!user) {
      toast({ title: 'User not found', description: 'No user with that email.' });
      return;
    }
    // Add role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: newStaffRole });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Staff added.' });
      setNewStaffEmail('');
      fetchStaff();
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!window.confirm('Remove this staff member?')) return;
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', staffId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Removed', description: 'Staff removed.' });
      fetchStaff();
    }
  };

  const handleRoleChange = async (staffId: string, newRole: 'admin' | 'moderator' | 'user') => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', staffId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role updated', description: 'Staff role updated.' });
      fetchStaff();
    }
  };

  const filteredStaff = staff.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Management</CardTitle>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Search by email or role"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Staff email"
            value={newStaffEmail}
            onChange={e => setNewStaffEmail(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={newStaffRole}
            onChange={e => setNewStaffRole(e.target.value as 'admin' | 'moderator')}
            className="border rounded px-2 py-1"
          >
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
          <Button onClick={handleAddStaff}>Add Staff</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    <select
                      value={s.role}
                      onChange={e => handleRoleChange(s.id, e.target.value as 'admin' | 'moderator' | 'user')}
                      className="border rounded px-2 py-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveStaff(s.id)}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffAdminPage; 