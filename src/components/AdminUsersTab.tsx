
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Dummy data for demonstration
const usersDemo = [
  { id: '1', name: 'John Doe', email: 'john@example.com', kyc: 'approved', balance: 5000, verified: true, active: true },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', kyc: 'pending', balance: 200, verified: false, active: false },
];

const AdminUsersTab = () => {
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filteredUsers = usersDemo.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'kyc-approved') return user.kyc === 'approved';
    if (filter === 'kyc-pending') return user.kyc === 'pending';
    if (filter === 'active') return user.active;
    if (filter === 'inactive') return !user.active;
    return true;
  });

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <Label>Filter:</Label>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="kyc-approved">KYC Approved</option>
          <option value="kyc-pending">KYC Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>KYC</th>
                <th>Balance</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-t">
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.kyc}</td>
                  <td>₦{user.balance.toLocaleString()}</td>
                  <td>{user.verified ? 'Yes' : 'No'}</td>
                  <td>{user.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <Button size="sm" onClick={() => setSelectedUser(user)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-2">User Details</h2>
            <p><b>Name:</b> {selectedUser.name}</p>
            <p><b>Email:</b> {selectedUser.email}</p>
            <p><b>KYC:</b> {selectedUser.kyc}</p>
            <p><b>Balance:</b> ₦{selectedUser.balance.toLocaleString()}</p>
            <p><b>Verified:</b> {selectedUser.verified ? 'Yes' : 'No'}</p>
            <p><b>Status:</b> {selectedUser.active ? 'Active' : 'Inactive'}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedUser(null)}>Close</Button>
              {selectedUser.kyc === 'pending' && (
                <Button size="sm" onClick={() => alert('KYC Approved!')}>Approve KYC</Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => alert('User Suspended!')}>Suspend</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
