
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileText, Eye, Check, X, Clock, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KycApplication } from '@/hooks/useAdminData';

interface AdminKycTabProps {
  kycApplications: KycApplication[];
  onDataUpdate: () => void;
}

const AdminKycTab: React.FC<AdminKycTabProps> = ({ kycApplications, onDataUpdate }) => {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<KycApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [bulkAction, setBulkAction] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApproveKyc = async (applicationId: string, userId: string, kycLevel: number, notes?: string) => {
    setLoading(applicationId);
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes || reviewNotes
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Update user's KYC level and verification status
      await supabase
        .from('profiles')
        .update({
          kyc_level: kycLevel,
          is_verified: true
        })
        .eq('id', userId);

      toast({
        title: "KYC Approved",
        description: "User KYC application has been approved successfully",
      });

      onDataUpdate();
      setReviewNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve KYC application",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRejectKyc = async (applicationId: string, reason: string, notes?: string) => {
    setLoading(applicationId);
    try {
      const { error } = await supabase
        .from('kyc_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes || reviewNotes
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "KYC Rejected",
        description: "User KYC application has been rejected",
      });

      onDataUpdate();
      setRejectionReason('');
      setReviewNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject KYC application",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApplications.length === 0) return;

    setLoading('bulk');
    try {
      const updates = selectedApplications.map(async (appId) => {
        const application = kycApplications.find(app => app.id === appId);
        if (!application) return;

        if (bulkAction === 'approve') {
          await handleApproveKyc(appId, application.user_id, application.kyc_level, 'Bulk approved');
        } else if (bulkAction === 'reject') {
          await handleRejectKyc(appId, 'Bulk rejection - requires manual review');
        }
      });

      await Promise.all(updates);
      setSelectedApplications([]);
      setBulkAction('');
      
      toast({
        title: "Bulk Action Complete",
        description: `${selectedApplications.length} applications processed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bulk action",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycLevelBadge = (level: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const pendingApplications = kycApplications.filter(app => app.status === 'submitted');
  const approvedApplications = kycApplications.filter(app => app.status === 'approved');
  const rejectedApplications = kycApplications.filter(app => app.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{approvedApplications.length}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{rejectedApplications.length}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{kycApplications.length}</div>
            <div className="text-sm text-gray-500">Total Applications</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{selectedApplications.length} selected</span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose bulk action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve All</SelectItem>
                  <SelectItem value="reject">Reject All</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkAction} 
                disabled={!bulkAction || loading === 'bulk'}
              >
                {loading === 'bulk' ? 'Processing...' : 'Execute'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedApplications([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KYC Applications Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycApplications.map((application) => (
              <div key={application.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedApplications([...selectedApplications, application.id]);
                        } else {
                          setSelectedApplications(selectedApplications.filter(id => id !== application.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">
                        {application.profiles?.first_name} {application.profiles?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{application.profiles?.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">Level:</span>
                        <Badge className={getKycLevelBadge(application.kyc_level)}>
                          Level {application.kyc_level}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">Occupation: {application.occupation}</div>
                      <div className="text-xs text-gray-400">
                        Submitted: {new Date(application.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>KYC Application Review</DialogTitle>
                        </DialogHeader>
                        {selectedApplication && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Full Name</Label>
                                <div className="text-sm text-gray-600">
                                  {selectedApplication.profiles?.first_name} {selectedApplication.profiles?.last_name}
                                </div>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <div className="text-sm text-gray-600">{selectedApplication.profiles?.email}</div>
                              </div>
                              <div>
                                <Label>KYC Level</Label>
                                <Badge className={getKycLevelBadge(selectedApplication.kyc_level)}>
                                  Level {selectedApplication.kyc_level}
                                </Badge>
                              </div>
                              <div>
                                <Label>Occupation</Label>
                                <div className="text-sm text-gray-600">{selectedApplication.occupation}</div>
                              </div>
                            </div>

                            <div>
                              <Label>Review Notes</Label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add your review notes here..."
                                className="mt-2"
                              />
                            </div>

                            {selectedApplication.status === 'submitted' && (
                              <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleApproveKyc(
                                      selectedApplication.id, 
                                      selectedApplication.user_id, 
                                      selectedApplication.kyc_level
                                    )}
                                    disabled={loading === selectedApplication.id}
                                    className="flex items-center gap-2"
                                  >
                                    <Check className="h-4 w-4" />
                                    {loading === selectedApplication.id ? 'Approving...' : 'Approve'}
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        Reject
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject KYC Application</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label>Rejection Reason</Label>
                                          <Select value={rejectionReason} onValueChange={setRejectionReason}>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select reason" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="documents_unclear">Documents not clear</SelectItem>
                                              <SelectItem value="information_mismatch">Information mismatch</SelectItem>
                                              <SelectItem value="insufficient_documents">Insufficient documents</SelectItem>
                                              <SelectItem value="identity_verification_failed">Identity verification failed</SelectItem>
                                              <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Button
                                          onClick={() => handleRejectKyc(selectedApplication.id, rejectionReason)}
                                          disabled={!rejectionReason || loading === selectedApplication.id}
                                          variant="destructive"
                                        >
                                          {loading === selectedApplication.id ? 'Rejecting...' : 'Confirm Rejection'}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            )}

                            {selectedApplication.status === 'approved' && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-green-800">
                                  <Check className="h-4 w-4" />
                                  <span className="font-medium">Application Approved</span>
                                </div>
                                <div className="text-sm text-green-600 mt-1">
                                  Approved on {new Date(selectedApplication.submitted_at).toLocaleString()}
                                </div>
                              </div>
                            )}

                            {selectedApplication.status === 'rejected' && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 text-red-800">
                                  <X className="h-4 w-4" />
                                  <span className="font-medium">Application Rejected</span>
                                </div>
                                <div className="text-sm text-red-600 mt-1">
                                  Reason: {rejectionReason || 'No reason provided'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {application.status === 'submitted' && (
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleApproveKyc(application.id, application.user_id, application.kyc_level)}
                      disabled={loading === application.id}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-3 w-3" />
                      {loading === application.id ? 'Processing...' : 'Quick Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectKyc(application.id, 'Requires additional documentation')}
                      disabled={loading === application.id}
                      className="flex items-center gap-2"
                    >
                      <X className="h-3 w-3" />
                      Quick Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminKycTab;
