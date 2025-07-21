import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = '/functions/admin-tasks';
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const AdminTasks: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (assignedToFilter) params.append('assigned_to', assignedToFilter);
      if (createdByFilter) params.append('created_by', createdByFilter);
      if (dueDateFilter) params.append('due_date', dueDateFilter);
      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTasks(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [statusFilter, assignedToFilter, createdByFilter, dueDateFilter]);

  const handleAdd = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, assigned_to: assignedTo, priority, due_date: dueDate, created_by: currentUser?.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionSuccess('Task created successfully.');
      setAddOpen(false);
      setTitle(''); setDescription(''); setAssignedTo(''); setPriority('medium'); setDueDate('');
      fetchTasks();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openComplete = (task: any) => {
    setSelectedTask(task);
    setCompleteOpen(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleComplete = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTask.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_by: currentUser?.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionSuccess('Task marked as completed.');
      setCompleteOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Tasks & Notifications</h1>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Admin Tasks</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>Add Task</Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="completed">Completed</option>
              </select>
              <Input placeholder="Assigned To (User ID)" value={assignedToFilter} onChange={e => setAssignedToFilter(e.target.value)} className="max-w-xs" />
              <Input placeholder="Created By (User ID)" value={createdByFilter} onChange={e => setCreatedByFilter(e.target.value)} className="max-w-xs" />
              <Input type="date" value={dueDateFilter} onChange={e => setDueDateFilter(e.target.value)} className="max-w-xs" />
              <Button size="sm" variant="outline" onClick={fetchTasks}>Refresh</Button>
            </div>
            {loading ? (
              <div>Loading tasks...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Priority</th>
                      <th className="px-4 py-2 text-left">Assigned To</th>
                      <th className="px-4 py-2 text-left">Due Date</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-t">
                        <td className="px-4 py-2 font-semibold">{task.title}</td>
                        <td className="px-4 py-2">{task.status}</td>
                        <td className="px-4 py-2">{task.priority}</td>
                        <td className="px-4 py-2">{task.assigned_to}</td>
                        <td className="px-4 py-2 text-xs">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2 text-xs">{task.created_at ? new Date(task.created_at).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedTask(task)}>View</Button>
                          {task.status === 'open' && (
                            <Button size="sm" variant="destructive" onClick={() => openComplete(task)}>Complete</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Task Details Dialog */}
        <Dialog open={!!selectedTask && !completeOpen} onOpenChange={v => { if (!v) setSelectedTask(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-2 text-sm">
                <div><b>Title:</b> {selectedTask.title}</div>
                <div><b>Description:</b> {selectedTask.description}</div>
                <div><b>Status:</b> {selectedTask.status}</div>
                <div><b>Priority:</b> {selectedTask.priority}</div>
                <div><b>Assigned To:</b> {selectedTask.assigned_to}</div>
                <div><b>Due Date:</b> {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : '-'}</div>
                <div><b>Created:</b> {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleString() : '-'}</div>
                {selectedTask.status === 'completed' && (
                  <div><b>Completed At:</b> {selectedTask.completed_at ? new Date(selectedTask.completed_at).toLocaleString() : '-'}</div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Add Task Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin Task</DialogTitle>
              <DialogDescription>All actions are logged. Please provide as much detail as possible.</DialogDescription>
            </DialogHeader>
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="mb-2" />
            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="mb-2 border rounded px-3 py-2 w-full" />
            <Input placeholder="Assigned To (User ID)" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mb-2" />
            <select value={priority} onChange={e => setPriority(e.target.value)} className="mb-2 border rounded px-3 py-2">
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mb-2" />
            <Button onClick={handleAdd} disabled={!title || !description || !assignedTo || actionLoading}>{actionLoading ? 'Adding...' : 'Add Task'}</Button>
            {actionError && <div className="text-red-500 mt-2">{actionError}</div>}
            {actionSuccess && <div className="text-green-600 mt-2">{actionSuccess}</div>}
          </DialogContent>
        </Dialog>
        {/* Complete Task Dialog */}
        <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Task</DialogTitle>
              <DialogDescription>All actions are logged. Mark this task as completed.</DialogDescription>
            </DialogHeader>
            <Button onClick={handleComplete} disabled={actionLoading}>{actionLoading ? 'Completing...' : 'Mark as Completed'}</Button>
            {actionError && <div className="text-red-500 mt-2">{actionError}</div>}
            {actionSuccess && <div className="text-green-600 mt-2">{actionSuccess}</div>}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTasks; 