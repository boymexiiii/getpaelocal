import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = '/functions/integration-secrets';

const IntegrationSecrets: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [secrets, setSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSecrets = async (revealValue = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${revealValue ? '?reveal=true' : ''}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSecrets(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSecrets(reveal); }, [reveal]);

  const handleAdd = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value, created_by: currentUser?.id || 'admin' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionSuccess('Secret added successfully.');
      setAddOpen(false);
      setName(''); setValue(''); setReason('');
      fetchSecrets(reveal);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSecret.id, value, updated_by: currentUser?.id || 'admin' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionSuccess('Secret updated successfully.');
      setEditOpen(false);
      setSelectedSecret(null);
      setValue(''); setReason('');
      fetchSecrets(reveal);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSecret.id, deleted_by: currentUser?.id || 'admin' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionSuccess('Secret deleted successfully.');
      setDeleteOpen(false);
      setSelectedSecret(null);
      fetchSecrets(reveal);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">API Key/Secret Management</h1>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Integration Secrets</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>Add Secret</Button>
              <Button size="sm" variant="outline" onClick={() => setReveal(r => !r)}>{reveal ? 'Hide Values' : 'Reveal Values'}</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading secrets...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Value</th>
                      <th className="px-4 py-2 text-left">Last Updated</th>
                      <th className="px-4 py-2 text-left">Created By</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secrets.map(s => (
                      <tr key={s.id} className="border-t">
                        <td className="px-4 py-2">{s.name}</td>
                        <td className="px-4 py-2">{s.value}</td>
                        <td className="px-4 py-2 text-xs">{s.updated_at ? new Date(s.updated_at).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2">{s.created_by}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedSecret(s); setValue(''); setEditOpen(true); }}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedSecret(s); setDeleteOpen(true); }}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Add Secret Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Integration Secret</DialogTitle>
              <DialogDescription>All actions are logged. Please provide a reason for audit.</DialogDescription>
            </DialogHeader>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="mb-2" />
            <Input placeholder="Value" value={value} onChange={e => setValue(e.target.value)} className="mb-2" />
            <Input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} className="mb-2" />
            <Button onClick={handleAdd} disabled={!name || !value || !reason || actionLoading}>{actionLoading ? 'Adding...' : 'Add Secret'}</Button>
            {actionError && <div className="text-red-500 mt-2">{actionError}</div>}
            {actionSuccess && <div className="text-green-600 mt-2">{actionSuccess}</div>}
          </DialogContent>
        </Dialog>
        {/* Edit Secret Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Integration Secret</DialogTitle>
              <DialogDescription>All actions are logged. Please provide a reason for audit.</DialogDescription>
            </DialogHeader>
            <Input placeholder="New Value" value={value} onChange={e => setValue(e.target.value)} className="mb-2" />
            <Input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} className="mb-2" />
            <Button onClick={handleEdit} disabled={!value || !reason || actionLoading}>{actionLoading ? 'Updating...' : 'Update Secret'}</Button>
            {actionError && <div className="text-red-500 mt-2">{actionError}</div>}
            {actionSuccess && <div className="text-green-600 mt-2">{actionSuccess}</div>}
          </DialogContent>
        </Dialog>
        {/* Delete Secret Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Integration Secret</DialogTitle>
              <DialogDescription>All actions are logged. Please provide a reason for audit.</DialogDescription>
            </DialogHeader>
            <Input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} className="mb-2" />
            <Button onClick={handleDelete} disabled={!reason || actionLoading} variant="destructive">{actionLoading ? 'Deleting...' : 'Delete Secret'}</Button>
            {actionError && <div className="text-red-500 mt-2">{actionError}</div>}
            {actionSuccess && <div className="text-green-600 mt-2">{actionSuccess}</div>}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default IntegrationSecrets; 