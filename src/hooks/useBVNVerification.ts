
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface BVNVerificationData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  verification_status: string;
}

interface BVNVerificationResult {
  success: boolean;
  verified: boolean;
  data?: BVNVerificationData;
  error?: string;
}

export const useBVNVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<BVNVerificationData | null>(null);

  const verifyBVN = async (bvn: string): Promise<BVNVerificationResult> => {
    if (!user) {
      return { success: false, verified: false, error: 'User not authenticated' };
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mono-bvn-verify', {
        body: {
          bvn: bvn.trim(),
          user_id: user.id
        }
      });

      if (error) {
        console.error('BVN verification error:', error);
        toast({
          title: "Verification Failed",
          description: error.message || "Failed to verify BVN. Please try again.",
          variant: "destructive"
        });
        return { success: false, verified: false, error: error.message };
      }

      if (data?.success && data?.verified) {
        setVerificationData(data.data);
        
        // Auto-populate form fields from BVN data
        const bvnData = data.data;
        toast({
          title: "BVN Verified Successfully",
          description: `Welcome ${bvnData.first_name} ${bvnData.last_name}! Your details have been pre-filled.`,
        });
        
        return { 
          success: true, 
          verified: true, 
          data: {
            ...bvnData,
            // Format date properly for form input
            date_of_birth: bvnData.date_of_birth ? new Date(bvnData.date_of_birth).toISOString().split('T')[0] : ''
          }
        };
      }

      return { success: false, verified: false, error: data?.error || 'Verification failed' };

    } catch (error) {
      console.error('Unexpected error during BVN verification:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: "Verification Error",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, verified: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearVerificationData = () => {
    setVerificationData(null);
  };

  return {
    verifyBVN,
    loading,
    verificationData,
    clearVerificationData,
    isVerified: !!verificationData
  };
};
