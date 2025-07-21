import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const adminList = ['admin1@example.com', 'admin2@example.com']; // Replace with real admin list from your system

const SystemAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resolveLoading, setResolveLoading] = useState<string | null>(null);
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<{ [id: string]: string }>({});
  const [assignments, setAssignments] = useState<{ [id: string]: string }>({});
  const [historyMode, setHistoryMode] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchAlerts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setAlerts(data || []);
      setLoading(false);
    };
    fetchAlerts();
    interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: string) => {
    setResolveLoading(id);
    await supabase.from('monitoring_alerts').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
    setAlerts(alerts => alerts.map(a => a.id === id ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() } : a));
    setResolveLoading(null);
  };

  const handleBulkResolve = async () => {
    if (selectedAlertIds.length === 0) return;
    setResolveLoading('bulk');
    await supabase.from('monitoring_alerts').update({ is_resolved: true, resolved_at: new Date().toISOString() }).in('id', selectedAlertIds);
    setAlerts(alerts => alerts.map(a => selectedAlertIds.includes(a.id) ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() } : a));
    setSelectedAlertIds([]);
    setResolveLoading(null);
  };

  const handleNoteChange = (id: string, value: string) => {
    setNotes(prev => ({ ...prev, [id]: value }));
  };

  const handleAssignmentChange = (id: string, value: string) => {
    setAssignments(prev => ({ ...prev, [id]: value }));
  };

  const filteredAlerts = alerts.filter(a =>
    (severityFilter === 'all' || a.severity === severityFilter) &&
    (typeFilter === 'all' || a.alert_type === typeFilter) &&
    (historyMode ? a.is_resolved : !a.is_resolved)
  );

  // Analytics: count of alerts per day (last 14 days)
  const alertCountsByDay: { [date: string]: number } = {};
  alerts.forEach(a => {
    const date = new Date(a.created_at).toLocaleDateString();
    alertCountsByDay[date] = (alertCountsByDay[date] || 0) + 1;
  });
  const chartData = Object.entries(alertCountsByDay)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, count]) => ({ date, count }));

  const isAllSelected = filteredAlerts.length > 0 && filteredAlerts.every(a => selectedAlertIds.includes(a.id));
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAlertIds(selectedAlertIds.filter(id => !filteredAlerts.some(a => a.id === id)));
    } else {
      setSelectedAlertIds([
        ...selectedAlertIds,
        ...filteredAlerts.filter(a => !selectedAlertIds.includes(a.id)).map(a => a.id)
      ]);
    }
  };
  const handleSelectAlert = (id: string) => {
    setSelectedAlertIds(selectedAlertIds.includes(id)
      ? selectedAlertIds.filter(aid => aid !== id)
      : [...selectedAlertIds, id]);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">System Alerts & Monitoring</h1>
        <div className="mb-4 flex gap-4 items-center">
          <select className="border rounded px-3 py-2" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="border rounded px-3 py-2" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="system_error">System Error</option>
            <option value="api_error">API Error</option>
            <option value="suspicious_activity">Suspicious Activity</option>
            <option value="failed_job">Failed Job</option>
            <option value="custom">Custom</option>
          </select>
          <Button size="sm" variant={historyMode ? 'default' : 'outline'} onClick={() => setHistoryMode(!historyMode)}>
            {historyMode ? 'Show Unresolved' : 'Show History'}
          </Button>
        </div>
        {/* Alert Analytics Chart */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Trend (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f87171" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        {/* Bulk Action Bar */}
        {selectedAlertIds.length > 0 && (
          <div className="mb-4 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded px-4 py-2">
            <span>{selectedAlertIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={handleBulkResolve} disabled={resolveLoading === 'bulk'}>
              {resolveLoading === 'bulk' ? 'Resolving...' : 'Bulk Resolve'}
            </Button>
            <button className="ml-auto text-gray-500 hover:text-gray-700" onClick={() => setSelectedAlertIds([])}>
              Clear
            </button>
          </div>
        )}
        {loading ? (
          <div>Loading alerts...</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{historyMode ? 'Resolved Alerts' : 'Recent Alerts'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">
                        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} />
                      </th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Severity</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Message</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2 text-left">Note</th>
                      <th className="px-4 py-2 text-left">Assigned</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map(alert => (
                      <tr key={alert.id} className="border-t">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedAlertIds.includes(alert.id)}
                            onChange={() => handleSelectAlert(alert.id)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Badge className="bg-gray-100 text-gray-800">{alert.alert_type}</Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge className={severityColors[alert.severity] || 'bg-gray-100 text-gray-800'}>{alert.severity}</Badge>
                        </td>
                        <td className="px-4 py-2 font-medium">{alert.title}</td>
                        <td className="px-4 py-2 text-sm">{alert.message}</td>
                        <td className="px-4 py-2">
                          {alert.is_resolved ? (
                            <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Resolved</span>
                          ) : (
                            <span className="text-orange-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Unresolved</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs">{new Date(alert.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            className="border rounded px-2 py-1 text-xs w-32"
                            placeholder="Add note..."
                            value={notes[alert.id] || ''}
                            onChange={e => handleNoteChange(alert.id, e.target.value)}
                            disabled={alert.is_resolved}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={assignments[alert.id] || ''}
                            onChange={e => handleAssignmentChange(alert.id, e.target.value)}
                            disabled={alert.is_resolved}
                          >
                            <option value="">Unassigned</option>
                            {adminList.map(admin => (
                              <option key={admin} value={admin}>{admin}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          {!alert.is_resolved && (
                            <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)} disabled={resolveLoading === alert.id}>
                              {resolveLoading === alert.id ? 'Resolving...' : 'Resolve'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default SystemAlerts; 