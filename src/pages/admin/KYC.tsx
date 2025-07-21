import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Calendar,
  Briefcase,
  DollarSign,
  AlertCircle,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUserRole } from '@/hooks/useUserRole';

const PAGE_SIZE = 10;

// Utility to convert array of objects to CSV string
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
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'bvn', label: 'BVN' },
    { key: 'kyc_level', label: 'Level' },
    { key: 'status', label: 'Status' },
    { key: 'submitted_at', label: 'Submitted' },
    { key: 'occupation', label: 'Occupation' },
    { key: 'state', label: 'State' },
    { key: 'phone', label: 'Phone' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'username', label: 'Username' },
  ];
  const rows = filteredKyc.map(k => ({
    name: `${k.profiles.first_name} ${k.profiles.last_name}`,
    email: k.profiles.email,
    bvn: k.bvn,
    kyc_level: k.kyc_level,
    status: k.status,
    submitted_at: k.submitted_at,
    occupation: k.occupation,
    state: k.profiles.state,
    phone: k.profiles.phone,
    date_of_birth: k.profiles.date_of_birth,
    username: k.profiles.username,
  }));
  const csv = toCSV(rows, columns);
  downloadCSV('kyc_applications.csv', csv);
};

const KYCAdminPage: React.FC = () => {
  const { kycApplications, loading } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [selectedKycIds, setSelectedKycIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docFeedback, setDocFeedback] = useState<{ [key: string]: string }>({});
  const [savingDocFeedback, setSavingDocFeedback] = useState<{ [key: string]: boolean }>({});
  const [kycDocMeta, setKycDocMeta] = useState<{ [key: string]: any }>({});
  const { logAction } = useAuditLog();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const { role, loading: roleLoading, hasRole } = useUserRole();

  // Add state for sorting
  const [sortField, setSortField] = useState<'submitted_at' | 'kyc_level' | 'status'>('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtering
  const filteredKyc = kycApplications
    .filter((k) => {
      const matchesSearch =
        (k.profiles.first_name + ' ' + k.profiles.last_name).toLowerCase().includes(search.toLowerCase()) ||
        k.profiles.email.toLowerCase().includes(search.toLowerCase()) ||
        (k.bvn || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : k.status === statusFilter;
      const matchesLevel = levelFilter === 'all' ? true : String(k.kyc_level) === levelFilter;
      return matchesSearch && matchesStatus && matchesLevel;
    })
    .sort((a, b) => {
      if (sortField === 'submitted_at') {
        return sortOrder === 'asc'
          ? new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
          : new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      } else if (sortField === 'kyc_level') {
        return sortOrder === 'asc' ? a.kyc_level - b.kyc_level : b.kyc_level - a.kyc_level;
      } else if (sortField === 'status') {
        return sortOrder === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredKyc.length / PAGE_SIZE);
  const paginatedKyc = filteredKyc.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleApprove = async () => {
    if (!selectedKyc) return;
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({ 
          status: 'approved',
          reviewer_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedKyc.id);

      if (error) throw error;

      // Update user profile to mark as verified
      await supabase
        .from('profiles')
        .update({ 
          is_verified: true,
          kyc_level: selectedKyc.kyc_level || 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedKyc.user_id);

      // Trigger KYC notification
      await fetch('/functions/v1/kyc-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kyc_id: selectedKyc.id,
          action: 'approved',
          admin_notes: reviewNotes
        })
      });

      // Log audit
      await logAction({
        action: 'KYC_APPROVED',
        table_name: 'kyc_applications',
        record_id: selectedKyc.id,
        old_data: { status: selectedKyc.status },
        new_data: { status: 'approved', reviewer_notes: reviewNotes }
      });

      toast({ title: 'Success', description: 'KYC application approved successfully.' });
      setSelectedKyc({ ...selectedKyc, status: 'approved' });
      setReviewNotes('');
      setModalOpen(false);
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast({ title: 'Error', description: 'Failed to approve KYC application.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKyc || !rejectionReason.trim()) {
      toast({ title: 'Error', description: 'Please provide a rejection reason.', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewer_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedKyc.id);

      if (error) throw error;

      // Trigger KYC notification
      await fetch('/functions/v1/kyc-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kyc_id: selectedKyc.id,
          action: 'rejected',
          admin_notes: rejectionReason
        })
      });

      // Log audit
      await logAction({
        action: 'KYC_REJECTED',
        table_name: 'kyc_applications',
        record_id: selectedKyc.id,
        old_data: { status: selectedKyc.status },
        new_data: { status: 'rejected', rejection_reason: rejectionReason }
      });

      toast({ title: 'Success', description: 'KYC application rejected.' });
      setSelectedKyc({ ...selectedKyc, status: 'rejected', rejection_reason: rejectionReason });
      setRejectionReason('');
      setReviewNotes('');
      setShowRejectionForm(false);
      setModalOpen(false);
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast({ title: 'Error', description: 'Failed to reject KYC application.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (kyc: any) => {
    setSelectedKyc(kyc);
    setReviewNotes(kyc.reviewer_notes || '');
    setRejectionReason(kyc.rejection_reason || '');
    setShowRejectionForm(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedKyc(null);
    setReviewNotes('');
    setRejectionReason('');
    setShowRejectionForm(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'submitted':
      case 'under_review':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Bulk selection logic
  const isAllSelected = paginatedKyc.length > 0 && paginatedKyc.every(k => selectedKycIds.includes(k.id));
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKycIds(selectedKycIds.filter(id => !paginatedKyc.some(k => k.id === id)));
    } else {
      setSelectedKycIds([
        ...selectedKycIds,
        ...paginatedKyc.filter(k => !selectedKycIds.includes(k.id)).map(k => k.id)
      ]);
    }
  };
  
  const handleSelectKyc = (id: string) => {
    setSelectedKycIds(selectedKycIds.includes(id)
      ? selectedKycIds.filter(kid => kid !== id)
      : [...selectedKycIds, id]);
  };
  
  const handleBulkApprove = async () => {
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .in('id', selectedKycIds);

      if (error) throw error;

      // Update user profiles
      const applicationsToUpdate = kycApplications.filter(k => selectedKycIds.includes(k.id));
      for (const app of applicationsToUpdate) {
        await supabase
          .from('profiles')
          .update({ 
            is_verified: true,
            kyc_level: app.kyc_level || 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', app.user_id);
      }

      toast({ title: 'Success', description: 'Selected KYC applications approved.' });
      setSelectedKycIds([]);
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast({ title: 'Error', description: 'Failed to approve KYC applications.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };
  
  const handleBulkReject = async () => {
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({ 
          status: 'rejected',
          rejection_reason: 'Bulk rejection by admin',
          reviewed_at: new Date().toISOString()
        })
        .in('id', selectedKycIds);

      if (error) throw error;

      toast({ title: 'Success', description: 'Selected KYC applications rejected.' });
      setSelectedKycIds([]);
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      toast({ title: 'Error', description: 'Failed to reject KYC applications.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  // Fetch user KYC documents and their metadata when modal opens
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!selectedKyc?.user_id || !modalOpen) return;
      setDocsLoading(true);
      try {
        // List all files for this user in the kyc-documents bucket
        const { data: storageData, error: storageError } = await supabase.storage.from('kyc-documents').list(`${selectedKyc.user_id}/`);
        if (storageError) throw storageError;
        setUserDocuments(storageData || []);
        // Fetch kyc_documents metadata for this user
        const { data: metaData, error: metaError } = await supabase
          .from('kyc_documents')
          .select('document_type, reviewer_notes')
          .eq('user_id', selectedKyc.user_id);
        if (!metaError && metaData) {
          const metaMap: { [key: string]: any } = {};
          metaData.forEach((doc: any) => {
            metaMap[doc.document_type] = doc;
          });
          setKycDocMeta(metaMap);
          // Initialize docFeedback state with current reviewer_notes
          setDocFeedback(metaMap ? Object.fromEntries(Object.entries(metaMap).map(([type, doc]) => [type, doc.reviewer_notes || ''])) : {});
        }
      } catch (e) {
        setUserDocuments([]);
        setKycDocMeta({});
        setDocFeedback({});
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocuments();
  }, [selectedKyc?.user_id, modalOpen]);

  // Helper to get public URL for a document
  const getDocumentUrl = (fileName: string) => {
    const { data } = supabase.storage.from('kyc-documents').getPublicUrl(`${selectedKyc.user_id}/${fileName}`);
    return data?.publicUrl;
  };

  // Save feedback for a document
  const handleSaveDocFeedback = async (type: string) => {
    if (!selectedKyc?.user_id) return;
    setSavingDocFeedback((prev) => ({ ...prev, [type]: true }));
    try {
      await supabase
        .from('kyc_documents')
        .update({
          reviewer_notes: docFeedback[type] || null
        })
        .eq('user_id', selectedKyc.user_id)
        .eq('document_type', type);
      // Update local meta state
      setKycDocMeta((prev) => ({ ...prev, [type]: { ...prev[type], reviewer_notes: docFeedback[type] || '' } }));
    } finally {
      setSavingDocFeedback((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleOpenProfile = async (userId: string) => {
    setProfileModalOpen(true);
    // Try to get more up-to-date profile info from Supabase
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfileUser(data || null);
  };
  const handleCloseProfile = () => {
    setProfileModalOpen(false);
    setProfileUser(null);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">KYC Applications</h1>
            <p className="text-gray-600">Review and manage user verification applications</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{filteredKyc.length} Total Applications</Badge>
            <Badge variant="outline" className="bg-blue-50">
              {filteredKyc.filter(k => k.status === 'submitted').length} Pending
            </Badge>
            <Button size="sm" variant="outline" className="ml-2" onClick={handleExportCSV} title="Export filtered KYC to CSV">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedKycIds.length > 0 && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{selectedKycIds.length} applications selected</span>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleBulkApprove}
                    disabled={bulkLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {bulkLoading ? 'Approving...' : 'Approve All'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkReject}
                    disabled={bulkLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {bulkLoading ? 'Rejecting...' : 'Reject All'}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedKycIds([])}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or BVN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Filters and Sort Controls */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or BVN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
          <Button size="sm" variant={statusFilter === 'submitted' ? 'default' : 'outline'} onClick={() => setStatusFilter('submitted')}>Pending</Button>
          <Button size="sm" variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
          <Button size="sm" variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
          <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>All</Button>
          <Button size="sm" variant={levelFilter === '1' ? 'default' : 'outline'} onClick={() => setLevelFilter('1')}>Level 1</Button>
          <Button size="sm" variant={levelFilter === '2' ? 'default' : 'outline'} onClick={() => setLevelFilter('2')}>Level 2</Button>
          <Button size="sm" variant={levelFilter === '3' ? 'default' : 'outline'} onClick={() => setLevelFilter('3')}>Level 3</Button>
          <Button size="sm" variant={levelFilter === 'all' ? 'default' : 'outline'} onClick={() => setLevelFilter('all')}>All Levels</Button>
          <div className="ml-auto flex gap-2">
            <label className="text-xs text-gray-500">Sort by:</label>
            <select value={sortField} onChange={e => setSortField(e.target.value as any)} className="border rounded px-2 py-1 text-xs">
              <option value="submitted_at">Date</option>
              <option value="kyc_level">Level</option>
              <option value="status">Status</option>
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="border rounded px-2 py-1 text-xs">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        {/* KYC Applications Table */}
        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading KYC applications...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium">User</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">BVN</th>
                      <th className="px-4 py-3 text-left font-medium">Level</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Submitted</th>
                      <th className="px-4 py-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedKyc.map((k) => (
                      <tr key={k.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedKycIds.includes(k.id)}
                            onChange={() => handleSelectKyc(k.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {k.profiles.first_name} {k.profiles.last_name}
                                <Button size="icon" variant="ghost" className="ml-1 p-1" onClick={() => handleOpenProfile(k.user_id)} title="Quick View Profile">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="text-sm text-gray-500">{k.occupation || 'Not specified'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{k.profiles.email}</td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {k.bvn ? `${k.bvn.substring(0, 4)}****${k.bvn.substring(8)}` : 'Not provided'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">Level {k.kyc_level}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(k.status)}
                            {getStatusBadge(k.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(k.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(k)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filteredKyc.length)} of {filteredKyc.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* KYC Detail Modal */}
      {modalOpen && selectedKyc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">KYC Application Review</h2>
                  <p className="text-gray-600">Review application details and make a decision</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="font-medium">{selectedKyc.profiles.first_name} {selectedKyc.profiles.last_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p>{selectedKyc.profiles.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">BVN</Label>
                      <p className="font-mono">{selectedKyc.bvn || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">KYC Level</Label>
                      <Badge>Level {selectedKyc.kyc_level}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Occupation</Label>
                      <p>{selectedKyc.occupation || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Source of Funds</Label>
                      <p>{selectedKyc.source_of_funds || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Monthly Income</Label>
                      <p>{selectedKyc.monthly_income_range || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                      <p>{new Date(selectedKyc.submitted_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {docsLoading ? (
                    <div className="text-center text-gray-500">Loading documents...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['id_card', 'proof_of_address', 'proof_of_income'].map((type) => {
                        const doc = userDocuments.find((d) => d.name.startsWith(type));
                        return (
                          <div key={type} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm font-medium">{type === 'id_card' ? 'Government ID' : type === 'proof_of_address' ? 'Proof of Address' : 'Proof of Income'}</p>
                            <p className="text-xs text-gray-500">{type === 'proof_of_income' ? 'Optional' : 'Required'}</p>
                            {doc ? (
                              <>
                                <a
                                  href={getDocumentUrl(doc.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <Download className="w-4 h-4 mr-1 inline" />
                                  View
                                </a>
                                <div className="mt-3">
                                  <Textarea
                                    placeholder="Feedback for user (optional)"
                                    value={docFeedback[type] || ''}
                                    onChange={e => setDocFeedback(f => ({ ...f, [type]: e.target.value }))}
                                    rows={2}
                                    className="w-full text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    className="mt-1"
                                    onClick={() => handleSaveDocFeedback(type)}
                                    disabled={savingDocFeedback[type]}
                                  >
                                    {savingDocFeedback[type] ? 'Saving...' : 'Save Feedback'}
                                  </Button>
                                  {kycDocMeta[type]?.reviewer_notes && (
                                    <div className="mt-1 text-xs text-gray-500 text-left">Current: {kycDocMeta[type].reviewer_notes}</div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="block mt-2 text-xs text-gray-400">Not uploaded</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Notes</CardTitle>
                  <CardDescription>Add notes for your review decision</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add review notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Rejection Reason (if rejecting) */}
              {showRejectionForm && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800">Rejection Reason</CardTitle>
                    <CardDescription>Please provide a reason for rejection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Enter rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="border-red-300 focus:border-red-500"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                
                {selectedKyc.status === 'submitted' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectionForm(!showRejectionForm)}
                      disabled={!hasRole('admin')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading || !hasRole('admin')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {actionLoading ? 'Approving...' : 'Approve'}
                    </Button>
                  </>
                )}
                
                {showRejectionForm && (
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason.trim() || !hasRole('admin')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={profileModalOpen} onOpenChange={v => { if (!v) handleCloseProfile(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Quick view of user details</DialogDescription>
          </DialogHeader>
          {profileUser ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profileUser.avatar_url || undefined} alt={profileUser.first_name} />
                <AvatarFallback>{profileUser.first_name?.[0]}{profileUser.last_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-lg font-semibold">{profileUser.first_name} {profileUser.last_name}</div>
              <div className="text-sm text-gray-500">{profileUser.email}</div>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                <div><span className="font-medium">Phone:</span> {profileUser.phone || 'N/A'}</div>
                <div><span className="font-medium">DOB:</span> {profileUser.date_of_birth || 'N/A'}</div>
                <div><span className="font-medium">State:</span> {profileUser.state || 'N/A'}</div>
                <div><span className="font-medium">KYC Level:</span> {profileUser.kyc_level || 'N/A'}</div>
                <div><span className="font-medium">Verified:</span> {profileUser.is_verified ? 'Yes' : 'No'}</div>
                {profileUser.username && <div><span className="font-medium">Username:</span> {profileUser.username}</div>}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">Loading...</div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default KYCAdminPage; 