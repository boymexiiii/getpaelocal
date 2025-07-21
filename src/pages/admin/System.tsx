import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SystemStatus {
  uptime: string;
  lastBackup: string;
  cacheStatus: string;
}

interface SystemLog {
  id: number;
  message: string;
  timestamp: string;
}

const SystemAdminPage = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSystemData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/functions/v1/admin-system-tools');
      if (!res.ok) throw new Error('Failed to fetch system data');
      const data = await res.json();
      setStatus(data.status);
      setLogs(data.logs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleAction = async (action: 'clear_cache' | 'trigger_backup') => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/functions/v1/admin-system-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed to trigger action');
      await res.json();
      fetchSystemData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div>Loading system data...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div>Uptime: {status?.uptime}</div>
              <div>Last Backup: {status?.lastBackup}</div>
              <div>Cache Status: {status?.cacheStatus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="mr-4" onClick={() => handleAction('clear_cache')} disabled={actionLoading}>Clear Cache</Button>
              <Button onClick={() => handleAction('trigger_backup')} disabled={actionLoading}>Trigger Backup</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <ul>
                  {logs.map(log => (
                    <li key={log.id} className="mb-2">
                      <span className="font-mono text-xs text-gray-600">[{log.timestamp}]</span> {log.message}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-400 mt-2">Logs are currently placeholder. TODO: Integrate with real system logs source.</div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SystemAdminPage; 