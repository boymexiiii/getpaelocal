import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StaffAdminPage = () => {
  const { user, role, loading, isAdminRole } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdminRole(role))) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdminRole(role)) return <div>Access denied</div>;

  useEffect(() => {
    // TODO: fetch real staff data from Supabase
    setStaff([
      { id: 1, email: 'admin@getpae.com', role: 'superadmin' },
      { id: 2, email: 'support@getpae.com', role: 'support' },
    ]);
    console.log('Fetched staff:', [
      { id: 1, email: 'admin@getpae.com', role: 'superadmin' },
      { id: 2, email: 'support@getpae.com', role: 'support' },
    ]);
  }, []);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="mb-4">Add Staff</Button>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingStaff ? (
                <div>Loading staff...</div>
              ) : staff.length === 0 ? (
                <div>No staff found.</div>
              ) : (
                staff.map(member => (
                  <tr key={member.id} className="border-t">
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="destructive">Remove</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAdminPage; 