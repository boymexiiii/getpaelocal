import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const API_BASE = '/functions/audit-log-export';

const AuditLogExport: React.FC = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = (format: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (user) params.append('user', user);
    if (action) params.append('action', action);
    params.append('format', format);
    return params.toString();
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(format);
      const res = await fetch(`${API_BASE}?${query}`);
      if (!res.ok) throw new Error('Failed to export logs');
      if (format === 'csv') {
        const csv = await res.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_logs.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_logs.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    setVerifyResult(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/verify`);
      const data = await res.json();
      if (data.valid) {
        setVerifyResult('Audit log integrity: VALID');
      } else {
        setVerifyResult(`Audit log integrity: INVALID (first invalid entry: ${data.invalidId})`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Audit Log Export & Integrity</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Export Audit Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center flex-wrap">
            <Input type="date" placeholder="From" value={from} onChange={e => setFrom(e.target.value)} className="max-w-xs" />
            <Input type="date" placeholder="To" value={to} onChange={e => setTo(e.target.value)} className="max-w-xs" />
            <Input placeholder="User ID" value={user} onChange={e => setUser(e.target.value)} className="max-w-xs" />
            <Input placeholder="Action" value={action} onChange={e => setAction(e.target.value)} className="max-w-xs" />
            <Button onClick={() => handleExport('json')} disabled={loading}>Export JSON</Button>
            <Button onClick={() => handleExport('csv')} disabled={loading}>Export CSV</Button>
            {loading && <span>Exporting...</span>}
            {error && <span className="text-red-500 ml-2">{error}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verify Audit Log Integrity</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleVerify} disabled={verifyLoading}>{verifyLoading ? 'Verifying...' : 'Verify Integrity'}</Button>
            {verifyResult && <div className="mt-2 text-green-700 font-semibold">{verifyResult}</div>}
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AuditLogExport; 