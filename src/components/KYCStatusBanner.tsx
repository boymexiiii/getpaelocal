import React from 'react';
import { useKYC } from '@/hooks/useKYC';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, XCircle, Shield } from 'lucide-react';
import { Button } from './ui/button';

const statusConfig = {
  draft: {
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: <AlertCircle className="w-5 h-5 mr-2" />,
    message: 'Your KYC is not complete. Please verify your identity to unlock all features.',
    action: 'Complete KYC',
  },
  submitted: {
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Clock className="w-5 h-5 mr-2" />,
    message: 'Your KYC application is under review. This usually takes 1-3 business days.',
    action: null,
  },
  under_review: {
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Clock className="w-5 h-5 mr-2" />,
    message: 'Your KYC application is under review. Please wait for approval.',
    action: null,
  },
  rejected: {
    color: 'bg-red-50 border-red-200 text-red-800',
    icon: <XCircle className="w-5 h-5 mr-2" />,
    message: 'Your KYC was rejected. Please review the feedback and resubmit your documents.',
    action: 'Resubmit KYC',
  },
  approved: {
    color: 'bg-green-50 border-green-200 text-green-800',
    icon: <CheckCircle className="w-5 h-5 mr-2" />,
    message: 'Your identity has been verified. You have full access to all features.',
    action: null,
  },
};

const KYCStatusBanner: React.FC = () => {
  const { application, loading } = useKYC();
  const navigate = useNavigate();

  if (loading || !application) return null;

  const status = application.status || 'draft';
  const config = statusConfig[status] || statusConfig['draft'];

  // Only show banner if not approved
  if (status === 'approved') return null;

  return (
    <div className={`flex items-center border rounded-lg px-4 py-3 mb-6 ${config.color}`}> 
      {config.icon}
      <div className="flex-1">
        <span className="font-medium">{config.message}</span>
        {status === 'rejected' && (
          <div className="mt-1 text-sm text-red-700">
            {application.rejection_reason && (
              <div><b>Reason:</b> {application.rejection_reason}</div>
            )}
            {application.reviewer_notes && (
              <div><b>Admin Feedback:</b> {application.reviewer_notes}</div>
            )}
          </div>
        )}
      </div>
      {config.action && (
        <Button
          className="ml-4"
          onClick={() => navigate('/kyc')}
          variant="outline"
        >
          {config.action}
        </Button>
      )}
    </div>
  );
};

export default KYCStatusBanner; 