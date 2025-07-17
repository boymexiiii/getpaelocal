import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: 'kyc-documents' | 'profile-images';
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<{ url: string; path: string } | null> => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to upload files',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file type
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: `Only ${allowedTypes.join(', ')} files are allowed`,
        variant: 'destructive',
      });
      return null;
    }

    // Validate file size (default 10MB for KYC, 5MB for profile images)
    const maxSize = options.maxSize || (options.bucket === 'kyc-documents' ? 10485760 : 5242880);
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: `File size must be less than ${Math.round(maxSize / 1048576)}MB`,
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Create file path: user_id/folder/filename
      const folder = options.folder || '';
      const filePath = folder 
        ? `${user.id}/${folder}/${fileName}`
        : `${user.id}/${fileName}`;

      console.log('Uploading file:', { bucket: options.bucket, filePath, fileSize: file.size });

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      setProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      console.log('File uploaded successfully:', { path: data.path, url: urlData.publicUrl });

      toast({
        title: 'Upload Successful',
        description: 'File uploaded successfully',
      });

      return {
        url: urlData.publicUrl,
        path: data.path,
      };

    } catch (error: any) {
      console.error('File upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (
    bucket: 'kyc-documents' | 'profile-images',
    filePath: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete files',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      toast({
        title: 'File Deleted',
        description: 'File deleted successfully',
      });

      return true;
    } catch (error: any) {
      console.error('File deletion failed:', error);
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete file',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getFileUrl = (bucket: 'kyc-documents' | 'profile-images', filePath: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    uploading,
    progress,
  };
};