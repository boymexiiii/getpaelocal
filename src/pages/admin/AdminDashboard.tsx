import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, CheckCircle, Clock, Server, Zap, Database, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DASHBOARD_WIDGETS = [
  { key: 'systemHealth', label: 'Integrations Status' },
  { key: 'activityFeed', label: 'Admin Activity Feed' },
  { key: 'manualCorrection', label: 'Manual Data Correction' },
  { key: 'integrationSecrets', label: 'API Key/Secret Management' },
  { key: 'auditLogExport', label: 'Audit Log Export & Integrity' },
];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKyc: 0,
    approvedKyc: 0,
    recentUsers: [],
    recentKyc: [],
  });
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any[]>([]);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const healthPrevRef = useRef<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [widgetPrefs, setWidgetPrefs] = useState<{ [key: string]: boolean }>({});

  // Load/save widget preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_dashboard_widgets');
    if (saved) {
      setWidgetPrefs(JSON.parse(saved));
    } else {
      // Default: all enabled
      const allEnabled: { [key: string]: boolean } = {};
      DASHBOARD_WIDGETS.forEach(w => { allEnabled[w.key] = true; });
      setWidgetPrefs(allEnabled);
    }
  }, []);
  const savePrefs = (prefs: { [key: string]: boolean }) => {
    setWidgetPrefs(prefs);
    localStorage.setItem('admin_dashboard_widgets', JSON.stringify(prefs));
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      // Total users
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      // Pending KYC
      const { count: pendingCount } = await supabase.from('kyc_applications').select('*', { count: 'exact', head: true }).eq('status', 'submitted');
      // Approved KYC
      const { count: approvedCount } = await supabase.from('kyc_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      // Recent users
      const { data: recentUsers } = await supabase.from('profiles').select('id, first_name, last_name, created_at').order('created_at', { ascending: false }).limit(5);
      // Recent KYC
      const { data: recentKyc } = await supabase.from('kyc_applications').select('id, user_id, status, submitted_at').order('submitted_at', { ascending: false }).limit(5);
      setStats({
        totalUsers: userCount || 0,
        pendingKyc: pendingCount || 0,
        approvedKyc: approvedCount || 0,
        recentUsers: recentUsers || [],
        recentKyc: recentKyc || [],
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  // Fetch health function
  const fetchHealth = async (showToast = true) => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetch('/functions/system-health');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Compare with previous for status change
        if (showToast && healthPrevRef.current.length > 0) {
          data.forEach((item: any, i: number) => {
            const prev = healthPrevRef.current.find((h: any) => h.name === item.name);
            if (prev && prev.status !== item.status) {
              toast({
                title: `Integration status changed: ${item.name}`,
                description: `${item.name} is now ${item.status.toUpperCase()}` + (item.error ? `: ${item.error}` : ''),
                variant: item.status === 'healthy' ? 'default' : 'destructive',
              });
            }
          });
        }
        setHealth(data);
        healthPrevRef.current = data;
      } else {
        setHealthError('Failed to load system health');
      }
    } catch (e: any) {
      setHealthError(e.message);
    } finally {
      setHealthLoading(false);
    }
  };

  // Initial and auto-refresh
  useEffect(() => {
    fetchHealth(false);
    intervalRef.current = setInterval(() => fetchHealth(), 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button size="sm" variant="outline" onClick={() => setCustomizeOpen(true)}>Customize Dashboard</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Pending KYC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingKyc}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Approved KYC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.approvedKyc}</div>
            </CardContent>
          </Card>
        </div>
        {/* System Health Widget */}
        {widgetPrefs.systemHealth !== false && (
          <div className="mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5" /> Integrations Status</CardTitle>
                <Button size="sm" variant="outline" onClick={() => fetchHealth()} disabled={healthLoading}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="flex items-center gap-2"><Loader2 className="animate-spin w-5 h-5" /> Loading system health...</div>
                ) : healthError ? (
                  <div className="text-red-500">{healthError}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left">Integration</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Last Checked</th>
                          <th className="px-4 py-2 text-left">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {health.map((i: any) => (
                          <tr key={i.name} className="border-t">
                            <td className="px-4 py-2">{i.name}</td>
                            <td className="px-4 py-2">
                              <span className="flex items-center gap-1">
                                <span className={`inline-block w-3 h-3 rounded-full ${i.status === 'healthy' ? 'bg-green-500' : i.status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                                {i.status === 'healthy' ? (
                                  <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Healthy</span>
                                ) : i.status === 'error' ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <span className="text-red-600 flex items-center gap-1 cursor-pointer"><AlertTriangle className="w-4 h-4" /> Error</span>
                                    </PopoverTrigger>
                                    <PopoverContent className="max-w-xs">
                                      <div className="text-sm text-red-700 font-semibold mb-1">Error Details</div>
                                      <div className="text-xs break-all">{i.error || 'Unknown error'}</div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <span className="text-gray-600">Unknown</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs">{i.lastChecked ? new Date(i.lastChecked).toLocaleString() : '-'}</td>
                            <td className="px-4 py-2 text-xs">
                              {i.status === 'error' && i.error ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-red-600">View</Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="max-w-xs">
                                    <div className="text-sm text-red-700 font-semibold mb-1">Error Details</div>
                                    <div className="text-xs break-all">{i.error}</div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span>-</span>
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
          </div>
        )}
        {/* Admin Activity Feed Link */}
        {widgetPrefs.activityFeed !== false && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Admin Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/admin/AuditLogExport">
                  <Button variant="outline">Audit Log Export & Integrity</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Manual Data Correction Link */}
        {widgetPrefs.manualCorrection !== false && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Manual Data Correction</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/admin/AuditLogExport">
                  <Button variant="outline">Audit Log Export & Integrity</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Integration Secrets Link */}
        {widgetPrefs.integrationSecrets !== false && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>API Key/Secret Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/admin/AuditLogExport">
                  <Button variant="outline">Audit Log Export & Integrity</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Audit Log Export Link */}
        {widgetPrefs.auditLogExport !== false && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log Export & Integrity</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/admin/AuditLogExport">
                  <Button variant="outline">Audit Log Export & Integrity</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Incident/Outage Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/admin/Incidents">
                <Button variant="outline">Incident/Outage Reporting</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        {/* Add this after the Incident/Outage Reporting card or in a suitable place */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Admin Tasks & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/admin/AdminTasks">
                <Button variant="outline">Admin Tasks & Notifications</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        {/* Add this after the Admin Tasks & Notifications card or in a suitable place */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import/Export</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/admin/BulkImportExport">
                <Button variant="outline">Bulk Import/Export</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {stats.recentUsers.map((u: any) => (
                  <li key={u.id} className="py-2 flex justify-between text-sm">
                    <span>{u.first_name} {u.last_name}</span>
                    <span className="text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent KYC Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {stats.recentKyc.map((k: any) => (
                  <li key={k.id} className="py-2 flex justify-between text-sm">
                    <span>{k.user_id}</span>
                    <span className="text-gray-400">{k.status} • {new Date(k.submitted_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        {/* Customize Dashboard Modal */}
        <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customize Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {DASHBOARD_WIDGETS.map(w => (
                <label key={w.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={widgetPrefs[w.key] !== false}
                    onChange={e => {
                      const newPrefs = { ...widgetPrefs, [w.key]: e.target.checked };
                      savePrefs(newPrefs);
                    }}
                  />
                  {w.label}
                </label>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">Your preferences are saved in your browser.</div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 