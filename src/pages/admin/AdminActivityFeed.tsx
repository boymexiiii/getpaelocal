import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const API_BASE = '/functions/admin-system-tools/audit-feed'; // Replace with real endpoint if available

const AdminActivityFeed: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        // For now, fetch from audit_logs table via Supabase REST (mock)
        const res = await fetch('/rest/v1/audit_logs?select=*');
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } else {
          setError('Failed to load activity feed');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filter logs in frontend
  const filteredLogs = logs.filter(log =>
    (!adminFilter || (log.user_id && log.user_id.toLowerCase().includes(adminFilter.toLowerCase()))) &&
    (!actionFilter || (log.action && log.action.toLowerCase().includes(actionFilter.toLowerCase()))) &&
    (!dateFilter || (log.created_at && log.created_at.startsWith(dateFilter)))
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Activity Feed</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center flex-wrap">
            <Input
              placeholder="Filter by admin user ID"
              value={adminFilter}
              onChange={e => setAdminFilter(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="Filter by action"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="max-w-xs"
            />
            <Input
              type="date"
              placeholder="Filter by date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => { setAdminFilter(''); setActionFilter(''); setDateFilter(''); }}>Clear</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading activity feed...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{log.user_id}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.table_name}</TableCell>
                        <TableCell>{log.record_id}</TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminActivityFeed; 