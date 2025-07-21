import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';

const PAGE_SIZE = 10;

const AuditLogsAdminPage: React.FC = () => {
  const { auditLogs, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Filtering
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter ? log.action === actionFilter : true;
    const matchesUser = userFilter ? (log.user_name && log.user_name.toLowerCase().includes(userFilter.toLowerCase())) : true;
    return matchesSearch && matchesAction && matchesUser;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleView = (log: any) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };
  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedLog(null);
  };

  function toCSV(rows: any[], columns: { key: string, label: string }[]) {
    const header = columns.map(col => `"${col.label}"`).join(',');
    const body = rows.map(row =>
      columns.map(col => `"${(row[col.key] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    return `${header}\n${body}`;
  }
  function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  const handleExportCSV = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'action', label: 'Action' },
      { key: 'user_id', label: 'User ID' },
      { key: 'table_name', label: 'Table' },
      { key: 'record_id', label: 'Record ID' },
      { key: 'created_at', label: 'Timestamp' },
      { key: 'ip_address', label: 'IP Address' },
      { key: 'user_agent', label: 'User Agent' },
      { key: 'old_data', label: 'Old Data' },
      { key: 'new_data', label: 'New Data' },
    ];
    const rows = filteredLogs.map(l => ({
      ...l,
      old_data: JSON.stringify(l.old_data),
      new_data: JSON.stringify(l.new_data)
    }));
    const csv = toCSV(rows, columns);
    downloadCSV('audit_logs.csv', csv);
  };
  function actionColor(action: string) {
    if (action.includes('APPROVE')) return 'bg-green-100 text-green-800';
    if (action.includes('REJECT')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800';
    if (action.includes('CREATE') || action.includes('INSERT')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('UPDATE')) return 'bg-purple-100 text-purple-800';
    if (action.includes('DELETE')) return 'bg-gray-200 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by action or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
          <input
            type="text"
            placeholder="Filter by user..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <Button size="sm" variant="outline" className="ml-2" onClick={handleExportCSV} title="Export filtered logs to CSV">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <div>Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2">{log.id}</td>
                    <td className="px-4 py-2">
                      <Badge className={actionColor(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-2">{log.user_name}</td>
                    <td className="px-4 py-2">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <Button size="icon" variant="ghost" onClick={() => handleView(log)} title="View Details">
                        <Eye className="w-4 h-4" />
                      </Button>
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
      <Dialog open={detailsModalOpen} onOpenChange={v => { if (!v) handleCloseDetails(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Full details of the selected audit log entry</DialogDescription>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">ID:</span> {selectedLog.id}</div>
              <div><span className="font-medium">Action:</span> <Badge className={actionColor(selectedLog.action)}>{selectedLog.action}</Badge></div>
              <div><span className="font-medium">User ID:</span> {selectedLog.user_id}</div>
              <div><span className="font-medium">Table:</span> {selectedLog.table_name}</div>
              <div><span className="font-medium">Record ID:</span> {selectedLog.record_id}</div>
              <div><span className="font-medium">Timestamp:</span> {new Date(selectedLog.created_at).toLocaleString()}</div>
              <div><span className="font-medium">IP Address:</span> {selectedLog.ip_address}</div>
              <div><span className="font-medium">User Agent:</span> <span className="break-all">{selectedLog.user_agent}</span></div>
              <div><span className="font-medium">Old Data:</span> <pre className="bg-gray-100 rounded p-2 overflow-x-auto max-h-40">{JSON.stringify(selectedLog.old_data, null, 2)}</pre></div>
              <div><span className="font-medium">New Data:</span> <pre className="bg-gray-100 rounded p-2 overflow-x-auto max-h-40">{JSON.stringify(selectedLog.new_data, null, 2)}</pre></div>
            </div>
          ) : (
            <div className="text-center text-gray-500">Loading...</div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AuditLogsAdminPage; 