
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Phone, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Shield,
  AlertCircle
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useKYC } from '@/hooks/useKYC';
import { useBVNVerification } from '@/hooks/useBVNVerification';
import { useTransactionLimits } from '@/hooks/useTransactionLimits';
import { useSentry } from '@/hooks/useSentry';
import { useToast } from '@/hooks/use-toast';
import BVNVerificationForm from '@/components/BVNVerificationForm';
import { supabase } from '@/integrations/supabase/client';

const KYC = () => {
  const { user } = useAuth();
  const { application, loading, createApplication, submitApplication } = useKYC();
  const { verifyBVN, loading: bvnLoading, verificationData, isVerified } = useBVNVerification();
  const { limits } = useTransactionLimits();
  const { logError, logUserAction } = useSentry();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    bvn: '',
    phone: '',
    date_of_birth: '',
    occupation: '',
    source_of_funds: '',
    monthly_income_range: '',
    first_name: '',
    last_name: '',
  });
  const [currentStep, setCurrentStep] = useState<'bvn' | 'details' | 'documents' | 'review'>('bvn');
  const [documents, setDocuments] = useState<{
    id_card?: File;
    proof_of_address?: File;
    proof_of_income?: File;
  }>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (application) {
      setFormData({
        bvn: application.bvn || '',
        phone: '',
        date_of_birth: '',
        occupation: application.occupation || '',
        source_of_funds: application.source_of_funds || '',
        monthly_income_range: application.monthly_income_range || '',
        first_name: application.first_name || '',
        last_name: application.last_name || '',
      });
      // Always show details step if BVN is verified and not yet submitted
      if (isVerified && (!application.status || application.status === 'draft')) {
        setCurrentStep('details');
      } else if (application.status === 'submitted' || application.status === 'under_review') {
        setCurrentStep('review');
      } else if (!isVerified) {
        setCurrentStep('bvn');
      }
    } else if (isVerified) {
      setCurrentStep('details');
    } else {
      setCurrentStep('bvn');
    }
  }, [application, isVerified]);

  const handleBVNVerification = async (bvn: string) => {
    try {
      logUserAction('kyc_bvn_verification_started', { bvn: bvn.substring(0, 4) + '****' });
      
      const result = await verifyBVN(bvn);
      
      if (result.success && result.verified) {
        setFormData(prev => ({
          ...prev,
          bvn: data.bvn || prev.bvn,
          first_name: data.first_name || prev.first_name,
          last_name: data.last_name || prev.last_name,
          date_of_birth: data.date_of_birth || prev.date_of_birth,
          phone: data.phone || prev.phone,
        }));
        setCurrentStep('details');
        logUserAction('kyc_bvn_verification_success');
        
        toast({
          title: "BVN Verified Successfully",
          description: "Please continue with your personal details",
        });
      } else {
        logError(new Error('BVN verification failed'), { bvn: bvn.substring(0, 4) + '****' });
      }
    } catch (error) {
      logError(error as Error, { step: 'bvn_verification' });
    }
  };

  const handleDocumentUpload = async (type: string, file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update documents state
      setDocuments(prev => ({ ...prev, [type]: file }));
      
      toast({
        title: "Document Uploaded",
        description: `${type.replace('_', ' ')} uploaded successfully`,
      });
    } catch (error) {
      logError(error as Error, { step: 'document_upload', type });
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Replace handleSubmit with handleDetailsNext for personal details step
  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('documents');
  };

  // Add a helper to check if required docs are uploaded
  const hasRequiredDocs = () => {
    return !!documents.id_card && !!documents.proof_of_address;
  };

  // Update handleSubmit to only be used in review step
  const handleFinalSubmit = async () => {
    if (!isVerified) {
      toast({
        title: "BVN Verification Required",
        description: "Please verify your BVN before proceeding",
        variant: "destructive"
      });
      return;
    }
    if (!hasRequiredDocs()) {
      toast({
        title: "Documents Required",
        description: "Please upload all required documents before submitting.",
        variant: "destructive"
      });
      return;
    }
    try {
      logUserAction('kyc_application_submission_started');
      if (!application) {
        const result = await createApplication({
          bvn: formData.bvn,
          occupation: formData.occupation,
          source_of_funds: formData.source_of_funds,
          monthly_income_range: formData.monthly_income_range
        });
        if (result.error) {
          logError(new Error(result.error), { step: 'create_application' });
          toast({
            title: "Creation Failed",
            description: result.error,
            variant: "destructive"
          });
          return;
        }
      }
      const result = await submitApplication();
      if (result.error) {
        logError(new Error(result.error), { step: 'submit_application' });
        toast({
          title: "Submission Failed",
          description: result.error,
          variant: "destructive"
        });
      } else {
        logUserAction('kyc_application_submitted_successfully');
        setCurrentStep('review');
        toast({
          title: "Application Submitted",
          description: "Your KYC application has been submitted for review",
        });
      }
    } catch (error) {
      logError(error as Error, { step: 'kyc_submission' });
      toast({
        title: "Submission Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-100 text-yellow-800">In Review</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  const getProgressValue = () => {
    switch (currentStep) {
      case 'bvn': return 25;
      case 'details': return 50;
      case 'documents': return 75;
      case 'review': return 100;
      default: return 0;
    }
  };

  // Add a helper to go back to previous step
  const handleBack = () => {
    if (currentStep === 'details') setCurrentStep('bvn');
    else if (currentStep === 'documents') setCurrentStep('details');
    else if (currentStep === 'review') setCurrentStep('documents');
  };

  // Fetch per-document feedback for the user
  const [docFeedback, setDocFeedback] = React.useState<{ [key: string]: string }>({});
  React.useEffect(() => {
    if (!user) return;
    supabase
      .from('kyc_documents')
      .select('document_type, reviewer_notes')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const map: { [key: string]: string } = {};
          data.forEach((doc: any) => {
            if (doc.reviewer_notes) map[doc.document_type] = doc.reviewer_notes;
          });
          setDocFeedback(map);
        }
      });
  }, [user, currentStep]);

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
            <p className="text-gray-600">Complete your identity verification to unlock all features</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">{getProgressValue()}% Complete</span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${currentStep === 'bvn' ? 'text-purple-600' : isVerified ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isVerified ? 'bg-green-600 border-green-600 text-white' : currentStep === 'bvn' ? 'border-purple-600' : 'border-gray-300'}`}>
                  {isVerified ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <span className="ml-2 text-sm font-medium">BVN Verification</span>
              </div>
              <div className={`flex items-center ${currentStep === 'details' ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'details' ? 'border-purple-600' : 'border-gray-300'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Personal Details</span>
              </div>
              <div className={`flex items-center ${currentStep === 'documents' ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'documents' ? 'border-purple-600' : 'border-gray-300'}`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Documents</span>
              </div>
              <div className={`flex items-center ${currentStep === 'review' ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'review' ? 'border-purple-600' : 'border-gray-300'}`}>
                  4
                </div>
                <span className="ml-2 text-sm font-medium">Review</span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Verification Status</span>
                {getStatusBadge(application?.status || 'draft')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {application?.status === 'approved' ? (
                  <div>
                    <p className="mb-2">Your identity has been verified. You can now access all Pae features.</p>
                    {limits && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="font-medium text-green-800">Your Transaction Limits (KYC Level {limits.kyc_level}):</p>
                        <ul className="text-sm text-green-700 mt-1">
                          <li>• Daily Send Limit: ₦{limits.daily_send_limit.toLocaleString()}</li>
                          <li>• Daily Spend Limit: ₦{limits.daily_spend_limit.toLocaleString()}</li>
                          <li>• Monthly Limit: ₦{limits.monthly_limit.toLocaleString()}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : application?.status === 'submitted' || application?.status === 'under_review' ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p>We're reviewing your application. This usually takes 1-3 business days.</p>
                  </div>
                ) : application?.status === 'rejected' ? (
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <p>Your application was rejected. Please review the feedback and resubmit.</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <p>Complete the form below to start your verification process.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BVN Verification Step */}
          {currentStep === 'bvn' && (
            <BVNVerificationForm
              onVerificationSuccess={(data) => {
                setFormData(prev => ({
                  ...prev,
                  bvn: data.bvn || prev.bvn,
                  first_name: data.first_name || prev.first_name,
                  last_name: data.last_name || prev.last_name,
                  date_of_birth: data.date_of_birth || prev.date_of_birth,
                  phone: data.phone || prev.phone,
                }));
                setCurrentStep('details');
              }}
              onVerificationError={(error) => {
                logError(new Error(error), { step: 'bvn_verification_form' });
              }}
            />
          )}

          {/* Personal Details Step */}
          {currentStep === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDetailsNext} className="space-y-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      className="pl-10"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      className="pl-10"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Last Name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="phone"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+234 800 000 0000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="date_of_birth"
                        type="date"
                        className="pl-10"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="occupation"
                        className="pl-10"
                        value={formData.occupation}
                        onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="source_of_funds">Source of Funds</Label>
                    <Select value={formData.source_of_funds} onValueChange={(value) => setFormData({...formData, source_of_funds: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source of funds" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="inheritance">Inheritance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="monthly_income_range">Monthly Income Range</Label>
                    <Select value={formData.monthly_income_range} onValueChange={(value) => setFormData({...formData, monthly_income_range: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-50000">₦0 - ₦50,000</SelectItem>
                        <SelectItem value="50000-100000">₦50,000 - ₦100,000</SelectItem>
                        <SelectItem value="100000-500000">₦100,000 - ₦500,000</SelectItem>
                        <SelectItem value="500000-1000000">₦500,000 - ₦1,000,000</SelectItem>
                        <SelectItem value="1000000+">₦1,000,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Continue to Documents'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Document Upload Step */}
          {currentStep === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Upload
                </CardTitle>
                <CardDescription>
                  Upload required documents for verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* ID Card Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <Label htmlFor="id_card" className="cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Government ID Card</span>
                        <p className="text-xs text-gray-500 mt-1">Passport, Driver's License, or National ID</p>
                      </Label>
                      <Input
                        id="id_card"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload('id_card', file);
                        }}
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {/* Proof of Address Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <Label htmlFor="proof_of_address" className="cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Proof of Address</span>
                        <p className="text-xs text-gray-500 mt-1">Utility bill, bank statement, or lease agreement</p>
                      </Label>
                      <Input
                        id="proof_of_address"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload('proof_of_address', file);
                        }}
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {/* Proof of Income Upload (Optional) */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <Label htmlFor="proof_of_income" className="cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Proof of Income (Optional)</span>
                        <p className="text-xs text-gray-500 mt-1">Payslip, bank statement, or tax return</p>
                      </Label>
                      <Input
                        id="proof_of_income"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload('proof_of_income', file);
                        }}
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                    <Button 
                      onClick={() => hasRequiredDocs() ? setCurrentStep('review') : toast({ title: 'Documents Required', description: 'Please upload all required documents before continuing.', variant: 'destructive' })}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Continue to Review'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Review Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Name:</span> {verificationData?.first_name} {verificationData?.last_name}</div>
                      <div><span className="font-medium">Phone:</span> {formData.phone}</div>
                      <div><span className="font-medium">Occupation:</span> {formData.occupation}</div>
                      <div><span className="font-medium">Income Range:</span> {formData.monthly_income_range}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Documents Uploaded</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Government ID Card</span>
                        {documents.id_card && <span className="text-xs text-gray-500">{documents.id_card.name}</span>}
                        {docFeedback['id_card'] && <span className="text-xs text-red-600 ml-2">Admin: {docFeedback['id_card']}</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Proof of Address</span>
                        {documents.proof_of_address && <span className="text-xs text-gray-500">{documents.proof_of_address.name}</span>}
                        {docFeedback['proof_of_address'] && <span className="text-xs text-red-600 ml-2">Admin: {docFeedback['proof_of_address']}</span>}
                      </div>
                      {documents.proof_of_income && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Proof of Income</span>
                          <span className="text-xs text-gray-500">{documents.proof_of_income.name}</span>
                          {docFeedback['proof_of_income'] && <span className="text-xs text-red-600 ml-2">Admin: {docFeedback['proof_of_income']}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                    <Button 
                      onClick={handleFinalSubmit}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default KYC;
