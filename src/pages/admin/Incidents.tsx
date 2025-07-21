import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = '/functions/incidents';
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const SERVICES = ['Supabase', 'Flutterwave', 'Paystack', 'Monnify', 'Email', 'Other'];

const Incidents: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [affected, setAffected] = useState<string[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIncidents(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [statusFilter, severityFilter, from, to]);

  const handleAdd = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, severity, affected_services: affected, created_by: currentUser?.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionSuccess('Incident reported successfully.');
      setAddOpen(false);
      setTitle(''); setDescription(''); setSeverity('medium'); setAffected([]);
      fetchIncidents();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openResolve = (incident: any) => {
    setSelectedIncident(incident);
    setResolutionNotes('');
    setResolveOpen(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleResolve = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedIncident.id,
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
          updated_by: currentUser?.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionSuccess('Incident marked as resolved.');
      setResolveOpen(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Incident/Outage Reporting</h1>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Incidents</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>Report Incident</Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="border rounded px-3 py-2">
                <option value="">All Severities</option>
                {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="max-w-xs" />
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="max-w-xs" />
              <Button size="sm" variant="outline" onClick={fetchIncidents}>Refresh</Button>
            </div>
            {loading ? (
              <div>Loading incidents...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Severity</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2 text-left">Affected</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id} className="border-t">
                        <td className="px-4 py-2 font-semibold">{inc.title}</td>
                        <td className="px-4 py-2">{inc.status}</td>
                        <td className="px-4 py-2">{inc.severity}</td>
                        <td className="px-4 py-2 text-xs">{inc.created_at ? new Date(inc.created_at).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2 text-xs">{(inc.affected_services || []).join(', ')}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedIncident(inc)}>View</Button>
                          {inc.status === 'open' && (
                            <Button size="sm" variant="destructive" onClick={() => openResolve(inc)}>Resolve</Button>
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
        {/* Incident Details Dialog */}
        <Dialog open={!!selectedIncident && !resolveOpen} onOpenChange={v => { if (!v) setSelectedIncident(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Incident Details</DialogTitle>
            </DialogHeader>
            {selectedIncident && (
              <div className="space-y-2 text-sm">
                <div><b>Title:</b> {selectedIncident.title}</div>
                <div><b>Description:</b> {selectedIncident.description}</div>
                <div><b>Status:</b> {selectedIncident.status}</div>
                <div><b>Severity:</b> {selectedIncident.severity}</div>
                <div><b>Created:</b> {selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : '-'}</div>
                <div><b>Affected Services:</b> {(selectedIncident.affected_services || []).join(', ')}</div>
                {selectedIncident.status === 'resolved' && (
                  <div><b>Resolution Notes:</b> {selectedIncident.resolution_notes}</div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Add Incident Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Incident</DialogTitle>
              <DialogDescription>All actions are logged. Please provide as much detail as possible.</DialogDescription>
            </DialogHeader>
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="mb-2" />
            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="mb-2 border rounded px-3 py-2 w-full" />
            <select value={severity} onChange={e => setSeverity(e.target.value)} className="mb-2 border rounded px-3 py-2">
              {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <div className="mb-2">
              <label className="block mb-1">Affected Services:</label>
              <div className="flex gap-2 flex-wrap">
                {SERVICES.map(s => (
                  <label key={s} className="flex items-center gap-1">
                    <input type="checkbox" checked={affected.includes(s)} onChange={e => {
                      if (e.target.checked) setAffected([...affected, s]);
                      else setAffected(affected.filter(a => a !== s));
                    }} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!title || !description || actionLoading}>{actionLoading ? 'Reporting...' : 'Report Incident'}</Button>
            {actionError && <div className="text-red-500 mt-2">{actionError}</div>}
            {actionSuccess && <div className="text-green-600 mt-2">{actionSuccess}</div>}
          </DialogContent>
        </Dialog>
        {/* Resolve Incident Dialog */}
        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Incident</DialogTitle>
              <DialogDescription>All actions are logged. Please provide resolution notes.</DialogDescription>
            </DialogHeader>
            <textarea placeholder="Resolution Notes" value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} className="mb-2 border rounded px-3 py-2 w-full" />
            <Button onClick={handleResolve} disabled={!resolutionNotes || actionLoading}>{actionLoading ? 'Resolving...' : 'Mark as Resolved'}</Button>
            {actionError && <div className="text-red-500 mt-2">{actionError}</div>}
            {actionSuccess && <div className="text-green-600 mt-2">{actionSuccess}</div>}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Incidents; 