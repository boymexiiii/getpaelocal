
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
      console.log('Starting BVN verification for:', bvn);
      
      // Try Flutterwave BVN verification first
      let { data, error } = await supabase.functions.invoke('bvn-verify', {
        body: { bvn: bvn.trim() }
      });

      console.log('Flutterwave result:', { data, error });

      // If Flutterwave fails, try Mono as fallback
      if (error || !data || data.status !== 'success') {
        console.log('Flutterwave BVN verification failed, trying Mono...');
        
        const monoResult = await supabase.functions.invoke('mono-bvn-verify', {
          body: { 
            bvn: bvn.trim(),
            user_id: user.id 
          }
        });

        console.log('Mono result:', monoResult);

        if (monoResult.error || !monoResult.data || !monoResult.data.success) {
          const errorMessage = (monoResult.data && monoResult.data.error) || 
                              monoResult.error?.message || 
                              "Failed to verify BVN. Please try again.";
          
          toast({
            title: "Verification Failed",
            description: errorMessage,
            variant: "destructive"
          });
          
          return { 
            success: false, 
            verified: false, 
            error: errorMessage 
          };
        }

        // Use Mono data
        data = monoResult.data;
      }

      // Map response to expected format
      const bvnData = {
        first_name: data.data.first_name,
        last_name: data.data.last_name,
        date_of_birth: data.data.date_of_birth,
        phone: data.data.phone,
        verification_status: 'verified',
      };

      setVerificationData(bvnData);
      
      // Show success message with provider info
      const provider = data.message ? ' (Fallback)' : ' (Flutterwave)';
      toast({
        title: "BVN Verified Successfully",
        description: `Welcome ${bvnData.first_name} ${bvnData.last_name}!${provider}`,
      });

      return {
        success: true,
        verified: true,
        data: {
          ...bvnData,
          date_of_birth: bvnData.date_of_birth ? new Date(bvnData.date_of_birth).toISOString().split('T')[0] : ''
        }
      };

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
