
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useFileUpload } from './useFileUpload';

interface KYCApplication {
  id: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_resubmission';
  kyc_level: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  reviewer_notes: string | null;
  bvn: string | null;
  occupation: string | null;
  monthly_income_range: string | null;
  source_of_funds: string | null;
  created_at: string;
  updated_at: string;
}

interface KYCDocument {
  id: string;
  document_type: 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address' | 'selfie';
  document_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  uploaded_at: string;
}

export const useKYC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { uploadFile } = useFileUpload();
  const [application, setApplication] = useState<KYCApplication | null>(null);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchKYCData();
    }
  }, [user]);

  const fetchKYCData = async () => {
    if (!user) return;

    try {
      // Fetch KYC application
      const { data: appData, error: appError } = await supabase
        .from('kyc_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (appError && appError.code !== 'PGRST116') {
        console.error('Error fetching KYC application:', appError);
      } else if (appData) {
        // Type cast to ensure proper types
        setApplication(appData as KYCApplication);
      }

      // Fetch KYC documents
      const { data: docsData, error: docsError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id);

      if (docsError) {
        console.error('Error fetching KYC documents:', docsError);
      } else if (docsData) {
        // Type cast to ensure proper types
        setDocuments(docsData as KYCDocument[]);
      }
    } catch (error) {
      console.error('Unexpected error fetching KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (applicationData: {
    bvn: string;
    occupation: string;
    monthly_income_range: string;
    source_of_funds: string;
  }) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('kyc_applications')
        .insert({
          user_id: user.id,
          ...applicationData,
          status: 'draft',
          bvn_verified: false // Add BVN verification status
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating KYC application:', error);
        return { error: error.message };
      }

      setApplication(data as KYCApplication);
      await logAction({
        action: 'KYC_APPLICATION_CREATED',
        table_name: 'kyc_applications',
        record_id: data.id,
        new_data: data
      });

      return { data };
    } catch (error) {
      console.error('Unexpected error creating KYC application:', error);
      return { error: 'Failed to create KYC application' };
    }
  };

  const submitApplication = async () => {
    if (!user || !application) return { error: 'No application to submit' };

    // Check if BVN is verified
    const { data: currentApp } = await supabase
      .from('kyc_applications')
      .select('bvn_verified')
      .eq('id', application.id)
      .single();

    if (!currentApp?.bvn_verified) {
      toast({
        title: "BVN Verification Required",
        description: "Please verify your BVN before submitting your application",
        variant: "destructive"
      });
      return { error: 'BVN verification required' };
    }

    // Check if required documents are uploaded
    const requiredDocs = ['id_card', 'proof_of_address'];
    const uploadedDocTypes = documents.map(doc => doc.document_type);
    const missingDocs = requiredDocs.filter(type => !uploadedDocTypes.includes(type as any));

    if (missingDocs.length > 0) {
      toast({
        title: "Missing Documents",
        description: `Please upload: ${missingDocs.join(', ')}`,
        variant: "destructive"
      });
      return { error: 'Missing required documents' };
    }

    try {
      const { data, error } = await supabase
        .from('kyc_applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', application.id)
        .select()
        .single();

      if (error) {
        console.error('Error submitting KYC application:', error);
        return { error: error.message };
      }

      setApplication(data as KYCApplication);
      await logAction({
        action: 'KYC_APPLICATION_SUBMITTED',
        table_name: 'kyc_applications',
        record_id: data.id,
        new_data: data
      });

      toast({
        title: "Application Submitted",
        description: "Your KYC application has been submitted for review. You'll be notified within 24-48 hours.",
      });

      return { data };
    } catch (error) {
      console.error('Unexpected error submitting KYC application:', error);
      return { error: 'Failed to submit KYC application' };
    }
  };

  const uploadDocument = async (file: File, documentType: KYCDocument['document_type']) => {
    if (!user || !application) return { error: 'No application found' };

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (file.size > maxSize) {
      return { error: 'File size must be less than 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { error: 'File must be JPEG, PNG, or PDF' };
    }

    try {
      // Upload file to Supabase Storage
      const uploadResult = await uploadFile(file, {
        bucket: 'kyc-documents',
        folder: documentType,
        allowedTypes,
        maxSize
      });
      if (!uploadResult) {
        return { error: 'Failed to upload file to storage' };
      }
      const documentUrl = uploadResult.url;
      const filePath = uploadResult.path;

      const { data, error } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_url: documentUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          storage_path: filePath
        })
        .select()
        .single();

      if (error) {
        console.error('Error uploading document:', error);
        return { error: error.message };
      }

      setDocuments(prev => [...prev, data as KYCDocument]);
      await logAction({
        action: 'KYC_DOCUMENT_UPLOADED',
        table_name: 'kyc_documents',
        record_id: data.id,
        new_data: data
      });

      toast({
        title: "Document Uploaded",
        description: `${documentType.replace('_', ' ')} uploaded successfully`,
      });

      return { data };
    } catch (error) {
      console.error('Unexpected error uploading document:', error);
      return { error: 'Failed to upload document' };
    }
  };

  const getKYCStatus = () => {
    if (!application) return 'not_started';
    return application.status;
  };

  const getKYCLevel = () => {
    return application?.kyc_level || 1;
  };

  const canUpgrade = () => {
    return application?.status === 'approved' && application.kyc_level < 3;
  };

  return {
    application,
    documents,
    loading,
    createApplication,
    submitApplication,
    uploadDocument,
    getKYCStatus,
    getKYCLevel,
    canUpgrade,
    refetch: fetchKYCData
  };
};
