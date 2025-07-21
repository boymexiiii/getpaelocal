import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = '/functions/bulk-import-export';
const TYPES = [
  { key: 'profiles', label: 'Users' },
  { key: 'transactions', label: 'Transactions' },
];

const BulkImportExport: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [type, setType] = useState('profiles');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}?type=${type}&format=${format}`);
      if (!res.ok) throw new Error('Failed to export data');
      if (format === 'csv') {
        const csv = await res.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}.csv`;
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
        a.download = `${type}.json`;
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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    setImportPreview([]);
    const file = e.target.files?.[0];
    setImportFile(file || null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          let data: any[] = [];
          if (file.name.endsWith('.json')) {
            data = JSON.parse(ev.target?.result as string);
          } else if (file.name.endsWith('.csv')) {
            const text = ev.target?.result as string;
            const [header, ...rows] = text.split(/\r?\n/);
            const columns = header.split(',');
            data = rows.filter(Boolean).map(row => {
              const values = row.split(',');
              const obj: any = {};
              columns.forEach((col, i) => { obj[col] = values[i]; });
              return obj;
            });
          }
          setImportPreview(data);
        } catch (err: any) {
          setImportError('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!importPreview.length) return;
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: importPreview, admin_id: currentUser?.id || 'admin' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImportSuccess(`Imported ${data.count} records successfully.`);
      setImportPreview([]);
      setImportFile(null);
    } catch (e: any) {
      setImportError(e.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bulk Import/Export</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center flex-wrap">
            <select value={type} onChange={e => setType(e.target.value)} className="border rounded px-3 py-2">
              {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <select value={format} onChange={e => setFormat(e.target.value)} className="border rounded px-3 py-2">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <Button onClick={handleExport} disabled={loading}>{loading ? 'Exporting...' : 'Export'}</Button>
            {error && <span className="text-red-500 ml-2">{error}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center flex-wrap mb-2">
              <select value={type} onChange={e => setType(e.target.value)} className="border rounded px-3 py-2">
                {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <input type="file" accept=".csv,.json" onChange={handleImportFile} />
            </div>
            {importPreview.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold mb-1">Preview ({importPreview.length} records):</div>
                <div className="overflow-x-auto max-h-48 border rounded">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        {Object.keys(importPreview[0] || {}).map(col => <th key={col} className="px-2 py-1 text-left">{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.keys(importPreview[0] || {}).map(col => <td key={col} className="px-2 py-1">{row[col]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-gray-500 mt-1">Only first 5 records shown. All records will be imported.</div>
                <Button onClick={handleImport} disabled={importLoading}>{importLoading ? 'Importing...' : 'Import'}</Button>
              </div>
            )}
            {importError && <div className="text-red-500 mt-2">{importError}</div>}
            {importSuccess && <div className="text-green-600 mt-2">{importSuccess}</div>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BulkImportExport; 