
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useKYC } from '@/hooks/useKYC';
import { useBVNVerification } from '@/hooks/useBVNVerification';
import { useTransactionLimits } from '@/hooks/useTransactionLimits';
import { useSentry } from '@/hooks/useSentry';
import { Shield, CheckCircle, AlertCircle, User, Phone, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import BVNVerificationForm from '@/components/BVNVerificationForm';

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
    monthly_income_range: ''
  });
  const [currentStep, setCurrentStep] = useState<'bvn' | 'details' | 'review'>('bvn');

  useEffect(() => {
    if (application) {
      setFormData({
        bvn: application.bvn || '',
        phone: '',
        date_of_birth: '',
        occupation: application.occupation || '',
        source_of_funds: application.source_of_funds || '',
        monthly_income_range: application.monthly_income_range || ''
      });
      
      // Determine current step based on application state
      if (application.bvn && isVerified) {
        setCurrentStep('details');
      } else if (application.status === 'submitted') {
        setCurrentStep('review');
      } else {
        setCurrentStep('bvn');
      }
    }
  }, [application, isVerified]);

  const handleBVNVerification = async (bvn: string) => {
    try {
      logUserAction('kyc_bvn_verification_started', { bvn: bvn.substring(0, 4) + '****' });
      
      const result = await verifyBVN(bvn);
      
      if (result.success && result.verified) {
        setFormData(prev => ({ ...prev, bvn }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isVerified) {
      toast({
        title: "BVN Verification Required",
        description: "Please verify your BVN before proceeding",
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
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Verified</span>
          </div>
        );
      case 'submitted':
      case 'under_review':
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle className="w-5 h-5" />
            <span>Under Review</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 text-gray-600">
            <Shield className="w-5 h-5" />
            <span>Not Started</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
            <p className="text-gray-600">Complete your identity verification to unlock all features</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${currentStep === 'bvn' ? 'text-purple-600' : isVerified ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isVerified ? 'bg-green-600 border-green-600 text-white' : currentStep === 'bvn' ? 'border-purple-600' : 'border-gray-300'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">BVN Verification</span>
              </div>
              <div className={`flex items-center ${currentStep === 'details' ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'details' ? 'border-purple-600' : 'border-gray-300'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Personal Details</span>
              </div>
              <div className={`flex items-center ${currentStep === 'review' ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'review' ? 'border-purple-600' : 'border-gray-300'}`}>
                  3
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
                  <p>We're reviewing your application. This usually takes 1-3 business days.</p>
                ) : (
                  <p>Complete the form below to start your verification process.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BVN Verification Step */}
          {currentStep === 'bvn' && (
            <BVNVerificationForm
              onVerificationSuccess={(data) => {
                setFormData(prev => ({ ...prev, bvn: prev.bvn }));
                setCurrentStep('details');
              }}
              onVerificationError={(error) => {
                logError(new Error(error), { step: 'bvn_verification_form' });
              }}
            />
          )}

          {/* Personal Details Step */}
          {currentStep === 'details' && isVerified && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                      placeholder="Your profession or job title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="source_of_funds">Source of Funds</Label>
                    <Input
                      id="source_of_funds"
                      value={formData.source_of_funds}
                      onChange={(e) => setFormData({...formData, source_of_funds: e.target.value})}
                      placeholder="e.g., Salary, Business, Investment"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthly_income_range">Monthly Income Range</Label>
                    <select
                      id="monthly_income_range"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.monthly_income_range}
                      onChange={(e) => setFormData({...formData, monthly_income_range: e.target.value})}
                      required
                    >
                      <option value="">Select income range</option>
                      <option value="Under ₦50,000">Under ₦50,000</option>
                      <option value="₦50,000 - ₦100,000">₦50,000 - ₦100,000</option>
                      <option value="₦100,000 - ₦250,000">₦100,000 - ₦250,000</option>
                      <option value="₦250,000 - ₦500,000">₦250,000 - ₦500,000</option>
                      <option value="₦500,000 - ₦1,000,000">₦500,000 - ₦1,000,000</option>
                      <option value="Over ₦1,000,000">Over ₦1,000,000</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('bvn')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default KYC;
