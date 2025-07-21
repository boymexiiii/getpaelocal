import React from 'react';
import { useKYC } from '@/hooks/useKYC';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, XCircle, Shield } from 'lucide-react';

const statusConfig = {
  draft: {
    color: 'bg-yellow-500',
    icon: <AlertCircle className="w-4 h-4 mr-1" />,
    message: 'Complete your KYC verification',
  },
  submitted: {
    color: 'bg-blue-500',
    icon: <Clock className="w-4 h-4 mr-1" />,
    message: 'KYC under review',
  },
  under_review: {
    color: 'bg-blue-500',
    icon: <Clock className="w-4 h-4 mr-1" />,
    message: 'KYC under review',
  },
  rejected: {
    color: 'bg-red-500',
    icon: <XCircle className="w-4 h-4 mr-1" />,
    message: 'KYC rejected - action required',
  },
};

const KYCStatusFloatingAlert: React.FC = () => {
  const { application, loading } = useKYC();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading || !application) return null;
  if (location.pathname.startsWith('/kyc')) return null;

  const status = application.status || 'draft';
  if (status === 'approved') return null;
  const config = statusConfig[status] || statusConfig['draft'];

  return (
    <div
      className={`fixed z-50 left-1/2 -translate-x-1/2 bottom-6 md:bottom-8 px-4 py-2 rounded-full shadow-lg flex items-center text-white ${config.color} cursor-pointer animate-bounce`}
      style={{ minWidth: 220, maxWidth: '90vw' }}
      onClick={() => navigate('/kyc')}
      role="button"
      aria-label="KYC status alert"
    >
      {config.icon}
      <span className="font-medium text-sm">{config.message}</span>
    </div>
  );
};

export default KYCStatusFloatingAlert; 